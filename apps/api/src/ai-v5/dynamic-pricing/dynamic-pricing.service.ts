import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  // Prix de base sur le marché (simulation de la réalité)
  private readonly BASE_PRICES: Record<string, number> = {
    PLASTICS: 120, // FCFA/kg
    METALS: 350,
    BIOMASS: 45,
    ELECTRONIC: 800,
    PAPER: 75,
    GLASS: 50,
    CONSTRUCTION: 25,
    CHEMICALS: 500,
    TEXTILE: 60,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Moteur de tarification intelligente.
   * Le prix recommandé dépend de : l'offre globale, la demande, et les historiques de prix.
   */
  async calculateRecommendedPrice(listingId: string): Promise<any> {
    this.logger.log(`[Pricing Engine] Calculating dynamic price for listing ${listingId}`);

    const listing = await this.prisma.wasteListing.findUnique({
      where: { id: listingId }
    });

    if (!listing) throw new Error("Listing introuvable");

    const basePrice = this.BASE_PRICES[listing.materialCategory] || 100;

    // 1. Calcul de l'offre (combien de kg de ce matériau sont actuellement disponibles sur la plateforme ?)
    const activeSupply = await this.prisma.wasteListing.aggregate({
      _sum: { volumeKg: true },
      where: {
        materialCategory: listing.materialCategory,
        status: { in: ['PUBLISHED'] }
      }
    });
    
    const supplyVolume = activeSupply?._sum?.volumeKg || 0;

    // Si l'offre est très élevée (ex: > 10 tonnes), le prix baisse (-10%).
    // Si l'offre est rare (ex: < 1 tonne), le prix monte (+15%).
    let supplyModifier = 1.0;
    if (supplyVolume > 10000) supplyModifier = 0.90;
    else if (supplyVolume < 1000) supplyModifier = 1.15;

    // 2. Bonus de pureté/qualité (si décrit dans la description)
    let qualityModifier = 1.0;
    if (listing.description?.toLowerCase().includes('trié') || listing.description?.toLowerCase().includes('propre')) {
      qualityModifier = 1.10; // +10% premium pour la qualité
    }

    // Calcul final
    const finalPrice = Math.round(basePrice * supplyModifier * qualityModifier);
    const intervalMin = Math.round(finalPrice * 0.95);
    const intervalMax = Math.round(finalPrice * 1.05);

    // Enregistrement de l'historique
    const pricing = await this.prisma.pricingHistory.create({
      data: {
        listingId,
        recommendedPrice: finalPrice,
        intervalMin,
        intervalMax,
        confidenceScore: 0.92
      }
    });

    this.logger.log(`💰 Recommended Price for ${listing.materialCategory}: ${finalPrice} FCFA/kg (Range: ${intervalMin}-${intervalMax})`);

    this.eventEmitter.emit('ai.pricePredicted', {
      listingId,
      recommendedPrice: finalPrice,
      intervalMin,
      intervalMax
    });

    return pricing;
  }
}
