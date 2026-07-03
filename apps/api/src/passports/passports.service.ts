import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import PDFDocument = require('pdfkit');

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Passeport créé',
  PICKED_UP: 'Matière enlevée',
  IN_TRANSIT: 'En transit',
  NEAR_DESTINATION: 'En approche',
  DELIVERED: 'Livré sur site',
  CONFIRMED: 'Réception confirmée',
};
const STATUS_ORDER = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED', 'CONFIRMED'];

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

    // Idempotent : un contrat n'a qu'un seul passeport → réutilise l'existant.
    const existing = await this.prisma.materialPassport.findFirst({
      where: { contractId },
      include: {
        contract: {
          include: { sellerCompany: true, buyerCompany: true, match: { include: { listing: true } } },
        },
      },
    });
    if (existing) return existing;

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

    const updated = await this.prisma.materialPassport.update({
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

    // Automatisation : notifie vendeur + acheteur à chaque jalon
    await this.notifyStatus(updated as any, status);
    return updated;
  }

  /** Crée une notification pour les utilisateurs vendeur + acheteur (non-bloquant). */
  private async notifyStatus(passport: any, status: string) {
    try {
      const companyIds = [passport.contract?.sellerCompanyId, passport.contract?.buyerCompanyId].filter(Boolean);
      if (!companyIds.length) return;
      const users = await this.prisma.user.findMany({ where: { companyId: { in: companyIds } }, select: { id: true } });
      const label = STATUS_LABELS[status] || status;
      await this.prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: (status === 'CONFIRMED' ? 'DELIVERY_CONFIRMED' : 'DELIVERY_UPDATE') as any,
          title: `Passeport — ${label}`,
          message: `Le passeport ${passport.id} est passé au statut « ${label} ».`,
          data: { passportId: passport.id, status },
        })),
      });
    } catch {
      // journalisation silencieuse : la notif ne doit pas casser la mise à jour
    }
  }

  /** Enregistre la preuve de livraison (signature + photo). */
  async saveDeliveryProof(id: string, signature?: string, photo?: string) {
    await this.findById(id);
    return this.prisma.materialPassport.update({
      where: { id },
      data: {
        deliverySignature: signature ?? undefined,
        deliveryPhotoUrl: photo ?? undefined,
        deliveryProofAt: new Date(),
      },
    });
  }

  /** Génère le PDF officiel du passeport (QR + traçabilité + impact carbone). */
  async generatePdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const p: any = await this.findById(id);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<void>((resolve) => doc.on('end', () => resolve()));

    const teal = '#0d9488';
    const dark = '#0f172a';
    const gray = '#64748b';
    const listing = p.contract?.match?.listing;
    const seller = p.contract?.sellerCompany;
    const buyer = p.contract?.buyerCompany;

    // Bandeau
    doc.rect(0, 0, doc.page.width, 90).fill(teal);
    doc.fillColor('#ffffff').fontSize(22).text('SymbioNexus', 50, 30);
    doc.fontSize(11).fillColor('#d1fae5').text('Passeport Numérique de Matière', 50, 60);

    // QR
    if (typeof p.qrCodeData === 'string' && p.qrCodeData.startsWith('data:image')) {
      try {
        const qrBuf = Buffer.from(p.qrCodeData.split(',')[1], 'base64');
        doc.image(qrBuf, doc.page.width - 160, 108, { width: 110 });
      } catch { /* QR optionnel */ }
    }

    let y = 118;
    doc.fontSize(9).fillColor(gray).text('IDENTIFIANT', 50, y);
    doc.fontSize(13).fillColor(dark).text(String(p.id), 50, y + 12);
    y = 175;

    const field = (label: string, value: string) => {
      doc.fontSize(9).fillColor(gray).text(label.toUpperCase(), 50, y);
      doc.fontSize(12).fillColor(dark).text(value || '—', 50, y + 12, { width: 380 });
      y += 42;
    };
    field('Matière', listing?.title || listing?.materialType || '—');
    field('Catégorie', listing?.materialCategory || '—');
    field('Volume engagé', `${p.contract?.volumeEngagedKg ?? '—'} kg`);
    field('Vendeur', `${seller?.name || '—'} — ${seller?.companyCity || ''}`);
    field('Acheteur', `${buyer?.name || '—'} — ${buyer?.companyCity || ''}`);

    // Traçabilité
    doc.fontSize(11).fillColor(teal).text('TRAÇABILITÉ LOGISTIQUE', 50, y);
    y += 20;
    const currentIdx = STATUS_ORDER.indexOf(p.transportStatus);
    STATUS_ORDER.forEach((st, i) => {
      const reached = i <= currentIdx;
      doc.circle(58, y + 7, 4).fill(reached ? teal : '#cbd5e1');
      doc.fillColor(reached ? dark : gray).fontSize(11).text(STATUS_LABELS[st] || st, 74, y);
      y += 22;
    });

    // Impact carbone
    if (p.carbonCredit) {
      y += 12;
      doc.fontSize(11).fillColor('#059669').text('IMPACT CARBONE', 50, y);
      y += 18;
      doc.fontSize(12).fillColor(dark).text(`${p.carbonCredit.co2AvoidedTonnes} tonnes de CO₂ évitées`, 50, y);
      y += 18;
      doc.fontSize(10).fillColor(gray).text(`≈ ${p.carbonCredit.equivalentTrees} arbres · ${p.carbonCredit.equivalentCarKm} km voiture évités`, 50, y);
    }

    doc.fontSize(8).fillColor(gray).text(
      `Document généré le ${new Date().toLocaleString('fr-FR')} — SymbioNexus, Cameroun`,
      50, doc.page.height - 60,
    );

    doc.end();
    await done;
    return { buffer: Buffer.concat(chunks), filename: `passeport-${p.id}.pdf` };
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
