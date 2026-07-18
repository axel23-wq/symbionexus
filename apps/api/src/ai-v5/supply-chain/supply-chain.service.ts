import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostGisRepository } from '../../geospatial/repositories/postgis.repository';

@Injectable()
export class SupplyChainAiService {
  private readonly logger = new Logger(SupplyChainAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly postGisRepo: PostGisRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Optimise la chaîne logistique pour un contrat donné.
   * Sélectionne le meilleur camion et le meilleur chauffeur.
   */
  async optimizeLogisticsRoute(matchId: string): Promise<any> {
    this.logger.log(`[Supply Chain Engine] Optimizing logistics for match ${matchId}`);

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { 
        listing: true,
        buyerCompany: true,
        sellerCompany: true
      }
    });

    if (!match) throw new Error("Match introuvable");

    // 1. Trouver les camions disponibles du côté acheteur ou vendeur
    const availableVehicles = await this.prisma.vehicle.findMany({
      where: {
        companyId: { in: [match.buyerCompanyId, match.sellerCompanyId] },
        status: 'AVAILABLE',
        capacityKg: { gte: match.listing.volumeKg } // Camion assez grand
      },
      include: { drivers: true, company: true }
    });

    if (availableVehicles.length === 0) {
      this.logger.warn(`Aucun véhicule disponible pour transporter ${match.listing.volumeKg}kg.`);
      return null; // TODO: handle fallback (external logistics)
    }

    // 2. Sélectionner le véhicule le plus proche géographiquement
    // Dans une version plus poussée, on utilise PostGIS Routing (pgRouting).
    // Ici, on utilise ST_DistanceSphere par rapport au lieu d'enlèvement (seller)
    
    let bestVehicle = null;
    let minDistance = Infinity;

    for (const vehicle of availableVehicles) {
      const vLat = vehicle.currentLat || vehicle.company.companyLatitude;
      const vLng = vehicle.currentLng || vehicle.company.companyLongitude;

      if (!vLat || !vLng) continue;

      const dist = await this.postGisRepo.calculateDistance(
        match.sellerCompany.companyLatitude,
        match.sellerCompany.companyLongitude,
        vLat,
        vLng
      );

      if (dist < minDistance) {
        minDistance = dist;
        bestVehicle = vehicle;
      }
    }

    if (!bestVehicle) {
      bestVehicle = availableVehicles[0]; // fallback
    }

    // 3. Assigner un chauffeur disponible
    const driver = bestVehicle.drivers.find((d: any) => d.status === 'AVAILABLE');

    this.logger.log(`🚛 Assigned Vehicle ${bestVehicle.plateNumber} to Match ${matchId}`);

    // Émettre l'événement pour alerter le Dashboard
    this.eventEmitter.emit('ai.logisticsOptimized', {
      matchId,
      vehicleId: bestVehicle.id,
      driverId: driver ? driver.id : null,
      routeDistanceKm: Math.round(minDistance * 10) / 10
    });

    return {
      bestVehicle,
      driver,
      pickupDistance: minDistance
    };
  }
}
