import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

@Injectable()
export class PassportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a material passport for a signed contract
   */
  async createPassport(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        sellerCompany: true,
        buyerCompany: true,
        match: { include: { listing: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contrat non trouvé');

    const passportId = `SN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Generate route waypoints (simulation)
    const waypoints = this.generateSimulatedRoute(
      contract.sellerCompany.companyLatitude,
      contract.sellerCompany.companyLongitude,
      contract.buyerCompany.companyLatitude,
      contract.buyerCompany.companyLongitude,
    );

    // Generate QR code data URL
    const qrData = JSON.stringify({
      passportId,
      contractId,
      material: contract.match.listing.materialType,
      volume: contract.volumeEngagedKg,
      seller: contract.sellerCompany.name,
      buyer: contract.buyerCompany.name,
      verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/passport/verify/${passportId}`,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });

    const estimatedArrival = new Date();
    estimatedArrival.setHours(estimatedArrival.getHours() + 24);

    return this.prisma.materialPassport.create({
      data: {
        contractId,
        qrCodeData: qrCodeDataUrl,
        transportStatus: 'CREATED',
        currentLatitude: contract.sellerCompany.companyLatitude,
        currentLongitude: contract.sellerCompany.companyLongitude,
        routeWaypoints: waypoints,
        estimatedArrival,
      },
      include: {
        contract: {
          include: {
            sellerCompany: true,
            buyerCompany: true,
            match: { include: { listing: true } },
          },
        },
      },
    });
  }

  /**
   * Update transport status (simulated transport progression)
   */
  async updateTransportStatus(passportId: string, status: string) {
    const passport = await this.prisma.materialPassport.findUnique({
      where: { id: passportId },
    });
    if (!passport) throw new NotFoundException('Passeport non trouvé');

    const waypoints = passport.routeWaypoints as any[];
    const statusOrder = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED', 'CONFIRMED'];
    const statusIndex = statusOrder.indexOf(status);

    // Determine current position based on status
    let waypointIndex = 0;
    if (waypoints.length > 0) {
      waypointIndex = Math.min(
        Math.floor((statusIndex / (statusOrder.length - 1)) * (waypoints.length - 1)),
        waypoints.length - 1,
      );
    }

    const currentWaypoint = waypoints[waypointIndex] || {};

    const updates: any = {
      transportStatus: status,
      currentLatitude: currentWaypoint.latitude,
      currentLongitude: currentWaypoint.longitude,
    };

    if (status === 'PICKED_UP') {
      updates.pickupAt = new Date();
    }
    if (status === 'DELIVERED') {
      updates.deliveredAt = new Date();
    }
    if (status === 'CONFIRMED') {
      updates.deliveryProofAt = new Date();
      updates.deliverySignature = `SIG-${Date.now()}`;
    }

    return this.prisma.materialPassport.update({
      where: { id: passportId },
      data: updates,
      include: {
        contract: {
          include: {
            sellerCompany: true,
            buyerCompany: true,
            match: { include: { listing: true } },
          },
        },
      },
    });
  }

  /**
   * Get passport by ID
   */
  async findById(id: string) {
    const passport = await this.prisma.materialPassport.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            sellerCompany: true,
            buyerCompany: true,
            match: { include: { listing: true } },
          },
        },
        carbonCredit: true,
      },
    });
    if (!passport) throw new NotFoundException('Passeport non trouvé');
    return passport;
  }

  /**
   * Get passports for a contract
   */
  async findByContract(contractId: string) {
    return this.prisma.materialPassport.findMany({
      where: { contractId },
      include: { carbonCredit: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate simulated route waypoints between two points
   */
  private generateSimulatedRoute(
    startLat: number, startLng: number,
    endLat: number, endLng: number,
    numPoints = 8,
  ) {
    const waypoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Add slight curve to route for realism
      const jitterLat = (Math.random() - 0.5) * 0.02;
      const jitterLng = (Math.random() - 0.5) * 0.02;
      waypoints.push({
        latitude: startLat + (endLat - startLat) * t + jitterLat,
        longitude: startLng + (endLng - startLng) * t + jitterLng,
        timestamp: new Date(Date.now() + i * 3 * 3600000).toISOString(), // 3h intervals
        label: i === 0 ? 'Départ usine' : i === numPoints ? 'Arrivée destination' : `Point de transit ${i}`,
      });
    }
    return waypoints;
  }
}
