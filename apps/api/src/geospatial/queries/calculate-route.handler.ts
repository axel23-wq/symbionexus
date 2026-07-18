import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CalculateRouteQuery } from './calculate-route.query';

@QueryHandler(CalculateRouteQuery)
export class CalculateRouteHandler implements IQueryHandler<CalculateRouteQuery> {
  // En production, ce service ferait appel à une API de routing (ex: OSRM, Google Maps, ou un service PostGIS de routage pgRouting)
  
  async execute(query: CalculateRouteQuery): Promise<any> {
    const { originLat, originLng, destLat, destLng, vehicleType } = query;
    
    // Calcul de distance à vol d'oiseau (formule de Haversine simplifiée pour le mock)
    // Idéalement, nous utiliserions ST_DistanceSphere via le PostGisRepository
    const R = 6371; // Rayon de la terre en km
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLng = (destLng - originLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    // Calcul de CO2 (mock: un camion pollue plus qu'une voiture)
    const co2PerKm = vehicleType === 'truck' ? 0.8 : (vehicleType === 'van' ? 0.3 : 0.15); // kg CO2 par km
    const estimatedCo2Kg = distanceKm * co2PerKm;

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedTimeMinutes: Math.round(distanceKm * 1.5), // Approximatif
      estimatedCo2Kg: parseFloat(estimatedCo2Kg.toFixed(2)),
      vehicleType,
    };
  }
}
