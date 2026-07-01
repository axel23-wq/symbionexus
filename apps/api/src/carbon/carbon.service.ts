import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      estimatedValue: Math.round(totalCO2Avoided * 80 * 100) / 100, // ~80€ per tonne
      monthlyBreakdown: Object.entries(monthlyData).map(([month, value]) => ({
        month,
        co2Avoided: Math.round(value * 100) / 100,
      })),
    };
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
