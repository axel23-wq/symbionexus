import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetActiveTransportsQuery } from './get-active-transports.query';

@QueryHandler(GetActiveTransportsQuery)
export class GetActiveTransportsHandler implements IQueryHandler<GetActiveTransportsQuery> {
  async execute() {
    // Simulation d'une remontée de base de données (Prisma) et des puces GPS
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Données simulées pour démontrer la fonctionnalité de suivi en direct
    return [
      {
        id: 'TRP-10492',
        truckPlate: 'LT-842-AB',
        driverName: 'Samuel Eto',
        material: 'Plastique PET Recyclé',
        volumeKg: 5000,
        departure: 'Douala Port',
        destination: 'Yaoundé Usine B',
        status: 'IN_TRANSIT',
        progressPercent: 68,
        eta: '14:30',
        currentLocation: { lat: 3.8480, lng: 11.5021 }, // Approche Yaoundé
        co2Saved: '42 kg',
        alerts: []
      },
      {
        id: 'TRP-10493',
        truckPlate: 'CE-112-XY',
        driverName: 'Jean Dupont',
        material: 'Cendre de Bois Agricole',
        volumeKg: 12000,
        departure: 'Bafoussam',
        destination: 'Kribi',
        status: 'IN_TRANSIT',
        progressPercent: 32,
        eta: '18:15',
        currentLocation: { lat: 4.8, lng: 10.3 }, // En route
        co2Saved: '110 kg',
        alerts: ['Vitesse réduite (Pluie)']
      },
      {
        id: 'TRP-10494',
        truckPlate: 'SU-999-ZZ',
        driverName: 'Marie Ndiaye',
        material: 'Acier Industriel',
        volumeKg: 25000,
        departure: 'Garoua',
        destination: 'Ngaoundéré',
        status: 'NEAR_DESTINATION',
        progressPercent: 95,
        eta: '10:05',
        currentLocation: { lat: 7.32, lng: 13.58 }, // Presque arrivé
        co2Saved: '320 kg',
        alerts: []
      }
    ];
  }
}
