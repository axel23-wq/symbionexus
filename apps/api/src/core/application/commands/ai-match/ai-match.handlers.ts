import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ComputeAiMatchCommand } from './ai-match.commands';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { PostGisRepository } from '../../../../geospatial/repositories/postgis.repository';
import { CarbonService } from '../../../../carbon/carbon.service';
import { GeospatialGateway } from '../../../../geospatial/gateways/geospatial.gateway';
import { XAiService } from '../../../../ai-v5/xai/xai.service';
import { DynamicPricingService } from '../../../../ai-v5/dynamic-pricing/dynamic-pricing.service';
import { SupplyChainAiService } from '../../../../ai-v5/supply-chain/supply-chain.service';

@CommandHandler(ComputeAiMatchCommand)
export class ComputeAiMatchHandler implements ICommandHandler<ComputeAiMatchCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postGisRepo: PostGisRepository,
    private readonly carbonService: CarbonService,
    private readonly geospatialGateway: GeospatialGateway,
    private readonly xaiService: XAiService,
    private readonly pricingService: DynamicPricingService,
    private readonly supplyChainService: SupplyChainAiService
  ) {}

  async execute(command: ComputeAiMatchCommand) {
    const { listingId } = command;

    const listing = await this.prisma.wasteListing.findUnique({
      where: { id: listingId },
      include: { company: true },
    });

    if (!listing) throw new NotFoundException('Annonce introuvable');

    // 1. Calcul du Prix Dynamique recommandé (V5)
    await this.pricingService.calculateRecommendedPrice(listingId);

    // Trouver les acheteurs potentiels (exclure le vendeur)
    const buyers = await this.prisma.company.findMany({
      where: {
        id: { not: listing.companyId },
        kybStatus: 'VERIFIED',
      },
    });

    const aiMatches = [];

    // Matrice de synergie (Catégorie de déchet -> Secteurs industriels compatibles)
    const synergyMatrix: Record<string, string[]> = {
      METALS: ['Métallurgie', 'Construction', 'Automobile', 'Industrie Lourde'],
      PLASTICS: ['Plasturgie', 'Emballage', 'Textile', 'Construction'],
      BIOMASS: ['Agroalimentaire', 'Agriculture', 'Énergie', 'Chimie'],
      CHEMICALS: ['Chimie', 'Pharmaceutique', 'Cosmétique'],
      TEXTILE: ['Textile', 'Ameublement', 'Construction'],
      CONSTRUCTION: ['Construction', 'Travaux Publics'],
      GLASS: ['Verrerie', 'Construction', 'Emballage'],
      PAPER: ['Papeterie', 'Emballage'],
      ELECTRONIC: ['Électronique', 'Recyclage Spécialisé', 'Métallurgie'],
    };

    for (const buyer of buyers) {
      // 1. Synergie Matérielle (0 ou 100)
      const compatibleSectors = synergyMatrix[listing.materialCategory] || [];
      const isSynergistic = compatibleSectors.includes(buyer.companySector);
      
      let materialScore = 0;
      let insight = '';

      if (isSynergistic) {
        materialScore = 100;
        insight = `L'IA a détecté une adéquation parfaite dans la chaîne de valeur du secteur ${buyer.companySector} pour la catégorie ${listing.materialCategory}.`;
      } else if (listing.description && listing.description.toLowerCase().includes('recyclable')) {
        materialScore = 60;
        insight = `Synergie cross-sectorielle possible basée sur l'analyse NLP de la description.`;
      } else {
        materialScore = 30; // Score par défaut très bas
        insight = `L'IA suggère une exploration de R&D entre ces secteurs déconnectés.`;
      }

      // Si le score matériel est trop bas, on ignore ce match pour l'optimisation
      if (materialScore < 50) continue;

      // 2. Distance Géospatiale (via PostGIS ST_DistanceSphere)
      const distanceKm = await this.postGisRepo.calculateDistance(
        listing.latitude,
        listing.longitude,
        buyer.companyLatitude,
        buyer.companyLongitude
      );

      // Calcul du score de distance (Optimal = 0km, Pénalité maximale = >500km)
      let distanceScore = 100 - (distanceKm / 5); 
      if (distanceScore < 0) distanceScore = 0;

      // 3. Empreinte Carbone (via CarbonService)
      const co2FootprintKg = this.carbonService.estimateTransportCO2(distanceKm, 'truck', listing.volumeKg);
      
      // 4. Fiabilité de l'entreprise
      const trustScore = buyer.trustScore ? Math.round(buyer.trustScore * 100) : 50;

      // Score Total Pondéré (40% Matériel, 40% Distance, 20% Trust)
      const totalScore = Math.round((materialScore * 0.4) + (distanceScore * 0.4) + (trustScore * 0.2));

      // Seuil d'acceptabilité de l'IA (On ne propose que les bons matchs)
      if (totalScore > 60) {
        const existing = await this.prisma.match.findUnique({
          where: { listingId_buyerCompanyId: { listingId, buyerCompanyId: buyer.id } },
        });

        const scoreBreakdown = {
          materialScore: Math.round(materialScore),
          distanceScore: Math.round(distanceScore),
          trustScore,
          co2FootprintKg,
          totalScore,
          aiInsight: insight
        };

        // Génération XAI (Explainable AI)
        const xaiJustification = this.xaiService.generateExplanation(
          Math.round(materialScore),
          Math.round(distanceScore),
          Math.round(distanceKm * 10) / 10,
          co2FootprintKg,
          trustScore,
          true // logistics available by default, real check done by Supply Chain engine later
        );

        if (existing) {
          const updated = await this.prisma.match.update({
            where: { id: existing.id },
            data: {
              compatibilityScore: totalScore,
              scoreBreakdown: scoreBreakdown as any,
              xaiJustification: xaiJustification as any,
              distanceKm: Math.round(distanceKm * 10) / 10,
              status: existing.status === 'REJECTED' ? 'REJECTED' : 'PROPOSED',
            },
            include: { buyerCompany: true, sellerCompany: true, listing: true },
          });
          aiMatches.push(updated);
        } else {
          const created = await this.prisma.match.create({
            data: {
              listingId,
              buyerCompanyId: buyer.id,
              sellerCompanyId: listing.companyId,
              compatibilityScore: totalScore,
              scoreBreakdown: scoreBreakdown as any,
              xaiJustification: xaiJustification as any,
              distanceKm: Math.round(distanceKm * 10) / 10,
              status: 'PROPOSED',
            },
            include: { buyerCompany: true, sellerCompany: true, listing: true },
          });
          aiMatches.push(created);
        }
      }
    }

    if (aiMatches.length > 0) {
      await this.prisma.wasteListing.update({
        where: { id: listingId },
        data: { status: 'MATCHED' },
      });
      
      // Trier par score IA
      const topMatches = aiMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 5);
      
      // Lancer l'optimisation logistique sur le meilleur match (V5)
      if (topMatches[0]) {
        await this.supplyChainService.optimizeLogisticsRoute(topMatches[0].id);
      }

      // 5. Diffuser l'événement en temps réel (WebSocket)
      this.geospatialGateway.server.emit('match.found', {
        listingId,
        matches: topMatches
      });

      return topMatches;
    }

    return [];
  }
}
