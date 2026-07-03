import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');

const PRICE_PER_TONNE_FCFA = 50000;

/** CO₂ emission factors (kg CO₂ per kg of material) */
const CO2_FACTORS: Record<string, { disposal: number; recycling: number }> = {
  METALS:       { disposal: 1.8,  recycling: 0.4  },
  PLASTICS:     { disposal: 2.9,  recycling: 0.7  },
  BIOMASS:      { disposal: 0.9,  recycling: 0.1  },
  CHEMICALS:    { disposal: 3.2,  recycling: 1.1  },
  TEXTILE:      { disposal: 2.1,  recycling: 0.5  },
  CONSTRUCTION: { disposal: 0.6,  recycling: 0.15 },
  THERMAL:      { disposal: 0.0,  recycling: 0.0  },
  GLASS:        { disposal: 0.8,  recycling: 0.3  },
  PAPER:        { disposal: 1.1,  recycling: 0.3  },
  ELECTRONIC:   { disposal: 4.5,  recycling: 1.5  },
};

@Injectable()
export class CarbonService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate CO₂ avoided and generate carbon credit for a confirmed delivery
   */
  async generateCreditFromPassport(passportId: string) {
    const passport = await this.prisma.materialPassport.findUnique({
      where: { id: passportId },
      include: {
        contract: {
          include: {
            match: { include: { listing: true } },
            sellerCompany: true,
          },
        },
        carbonCredit: true,
      },
    });

    if (!passport) throw new NotFoundException('Passeport non trouvé');
    if (passport.carbonCredit) return passport.carbonCredit; // Already generated

    const listing = passport.contract.match.listing;
    const factors = CO2_FACTORS[listing.materialCategory] || { disposal: 1.0, recycling: 0.3 };

    // CO₂ avoided = (disposal emissions - recycling emissions) * volume in tonnes
    const volumeTonnes = passport.contract.volumeEngagedKg / 1000;
    const co2AvoidedTonnes = Math.round((factors.disposal - factors.recycling) * volumeTonnes * 100) / 100;

    // Equivalent metrics for display
    const equivalentTrees = Math.round(co2AvoidedTonnes * 45); // ~45 trees absorb 1 tonne CO₂/year
    const equivalentCarKm = Math.round(co2AvoidedTonnes * 6000); // ~6000 km per tonne CO₂

    return this.prisma.carbonCredit.create({
      data: {
        passportId,
        companyId: passport.contract.sellerCompany.id,
        co2AvoidedTonnes,
        equivalentTrees,
        equivalentCarKm,
        marketStatus: 'GENERATED',
      },
      include: {
        passport: {
          include: {
            contract: {
              include: {
                match: { include: { listing: true } },
                sellerCompany: true,
                buyerCompany: true,
              },
            },
          },
        },
        company: true,
      },
    });
  }

  /**
   * Get carbon credits for a company
   */
  async findByCompany(companyId: string) {
    return this.prisma.carbonCredit.findMany({
      where: { companyId },
      include: {
        passport: {
          include: {
            contract: {
              include: {
                match: { include: { listing: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get carbon dashboard stats for a company
   */
  async getCompanyStats(companyId: string) {
    const credits = await this.prisma.carbonCredit.findMany({
      where: { companyId },
    });

    const totalCO2Avoided = credits.reduce((sum, c) => sum + c.co2AvoidedTonnes, 0);
    const totalTrees = credits.reduce((sum, c) => sum + c.equivalentTrees, 0);
    const totalCarKm = credits.reduce((sum, c) => sum + c.equivalentCarKm, 0);
    const totalCredits = credits.length;

    // Monthly breakdown
    const monthlyData: Record<string, number> = {};
    credits.forEach((credit) => {
      const month = credit.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + credit.co2AvoidedTonnes;
    });

    return {
      totalCO2Avoided: Math.round(totalCO2Avoided * 100) / 100,
      totalTrees,
      totalCarKm,
      totalCredits,
      estimatedValue: Math.round(totalCO2Avoided * 50000), // ~50 000 FCFA per tonne
      monthlyBreakdown: Object.entries(monthlyData).map(([month, value]) => ({
        month,
        co2Avoided: Math.round(value * 100) / 100,
      })),
    };
  }

  private async companyIdOf(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!u) throw new NotFoundException('Utilisateur non trouvé');
    return u.companyId;
  }

  private async assertOwner(id: string, companyId: string) {
    const c = await this.prisma.carbonCredit.findUnique({ where: { id }, select: { companyId: true } });
    if (!c) throw new NotFoundException('Crédit carbone non trouvé');
    if (c.companyId !== companyId) throw new ForbiddenException('Vous n\'êtes pas propriétaire de ce crédit');
  }

  /** Met un crédit en vente sur le marché secondaire. */
  async listForSale(userId: string, id: string, pricePerTonne?: number) {
    const companyId = await this.companyIdOf(userId);
    await this.assertOwner(id, companyId);
    return this.prisma.carbonCredit.update({
      where: { id },
      data: { marketStatus: 'LISTED_FOR_SALE', pricePerTonne: pricePerTonne ?? PRICE_PER_TONNE_FCFA },
    });
  }

  /** Retire un crédit de la vente. */
  async unlist(userId: string, id: string) {
    const companyId = await this.companyIdOf(userId);
    await this.assertOwner(id, companyId);
    return this.prisma.carbonCredit.update({ where: { id }, data: { marketStatus: 'CERTIFIED', pricePerTonne: null } });
  }

  /** Compense (retire définitivement) un crédit pour l'empreinte de l'entreprise. */
  async retire(userId: string, id: string) {
    const companyId = await this.companyIdOf(userId);
    await this.assertOwner(id, companyId);
    return this.prisma.carbonCredit.update({ where: { id }, data: { marketStatus: 'RETIRED' } });
  }

  /** Marché secondaire : tous les crédits en vente sur la plateforme. */
  async getMarket() {
    return this.prisma.carbonCredit.findMany({
      where: { marketStatus: 'LISTED_FOR_SALE' },
      include: {
        company: { select: { name: true, companyCity: true, trustScore: true } },
        passport: { include: { contract: { include: { match: { include: { listing: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Certificat PDF officiel d'un crédit carbone. */
  async getCertificatePdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const c: any = await this.prisma.carbonCredit.findUnique({
      where: { id },
      include: {
        company: true,
        passport: { include: { contract: { include: { match: { include: { listing: true } } } } } },
      },
    });
    if (!c) throw new NotFoundException('Crédit carbone non trouvé');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (d: Buffer) => chunks.push(d));
    const done = new Promise<void>((resolve) => doc.on('end', () => resolve()));

    const teal = '#0d9488';
    const dark = '#0f172a';
    const gray = '#64748b';
    const W = doc.page.width;

    // Cadre
    doc.rect(30, 30, W - 60, doc.page.height - 60).lineWidth(2).stroke(teal);
    doc.rect(0, 0, W, 100).fill(teal);
    doc.fillColor('#fff').fontSize(24).text('SymbioNexus', 50, 34);
    doc.fontSize(12).fillColor('#d1fae5').text('Certificat de Crédit Carbone', 50, 66);

    doc.fillColor(dark).fontSize(30).text('🌱', W / 2 - 20, 140);
    doc.fontSize(16).fillColor(teal).text('CERTIFICAT OFFICIEL', 0, 190, { align: 'center' });

    doc.fontSize(11).fillColor(gray).text('Décerné à', 0, 240, { align: 'center' });
    doc.fontSize(20).fillColor(dark).text(c.company?.name || '—', 0, 258, { align: 'center' });

    doc.fontSize(11).fillColor(gray).text('pour avoir évité', 0, 310, { align: 'center' });
    doc.fontSize(34).fillColor('#059669').text(`${c.co2AvoidedTonnes} tonnes de CO₂`, 0, 328, { align: 'center' });

    const listing = c.passport?.contract?.match?.listing;
    let y = 400;
    const row = (k: string, v: string) => {
      doc.fontSize(11).fillColor(gray).text(k, 120, y);
      doc.fontSize(12).fillColor(dark).text(v, 300, y, { width: 200 });
      y += 26;
    };
    row('Matière valorisée', listing?.materialType || '—');
    row('Arbres équivalents', `${c.equivalentTrees} arbres/an`);
    row('Km voiture évités', `${c.equivalentCarKm.toLocaleString('fr-FR')} km`);
    row('Statut', c.marketStatus);
    row('Identifiant', c.id);
    row('Date d\'émission', new Date(c.createdAt).toLocaleDateString('fr-FR'));

    doc.fontSize(9).fillColor(gray).text(
      `Certificat authentifié par SymbioNexus — ${new Date().toLocaleString('fr-FR')} — Cameroun`,
      0, doc.page.height - 80, { align: 'center' },
    );

    doc.end();
    await done;
    return { buffer: Buffer.concat(chunks), filename: `certificat-carbone-${c.id}.pdf` };
  }

  /**
   * Get platform-wide carbon stats (for admin dashboard)
   */
  async getPlatformStats() {
    const credits = await this.prisma.carbonCredit.findMany();
    const totalCO2 = credits.reduce((sum, c) => sum + c.co2AvoidedTonnes, 0);

    return {
      totalCO2Avoided: Math.round(totalCO2 * 100) / 100,
      totalCreditsIssued: credits.length,
      totalEstimatedValue: Math.round(totalCO2 * 80 * 100) / 100,
      totalEquivalentTrees: credits.reduce((sum, c) => sum + c.equivalentTrees, 0),
    };
  }
}
