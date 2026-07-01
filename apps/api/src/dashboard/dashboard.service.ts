import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard data for a company (seller/buyer)
   */
  async getCompanyDashboard(companyId: string) {
    const [
      activeListings,
      totalListings,
      pendingMatches,
      confirmedMatches,
      activeContracts,
      completedContracts,
      carbonCredits,
      recentTransactions,
      company,
    ] = await Promise.all([
      this.prisma.wasteListing.count({ where: { companyId, status: 'PUBLISHED' } }),
      this.prisma.wasteListing.count({ where: { companyId } }),
      this.prisma.match.count({
        where: {
          OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
          status: { in: ['PROPOSED', 'ACCEPTED_SELLER', 'ACCEPTED_BUYER'] },
        },
      }),
      this.prisma.match.count({
        where: {
          OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
          status: 'CONFIRMED',
        },
      }),
      this.prisma.contract.count({
        where: {
          OR: [{ sellerCompanyId: companyId }, { buyerCompanyId: companyId }],
          status: { in: ['SIGNED', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.contract.count({
        where: {
          OR: [{ sellerCompanyId: companyId }, { buyerCompanyId: companyId }],
          status: 'COMPLETED',
        },
      }),
      this.prisma.carbonCredit.aggregate({
        where: { companyId },
        _sum: { co2AvoidedTonnes: true },
        _count: true,
      }),
      this.prisma.contract.findMany({
        where: { OR: [{ sellerCompanyId: companyId }, { buyerCompanyId: companyId }] },
        include: {
          match: { include: { listing: true } },
          sellerCompany: true,
          buyerCompany: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    // Revenue calculation (sum of contract values where company is seller)
    const revenueData = await this.prisma.contract.aggregate({
      where: { sellerCompanyId: companyId, status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] } },
      _sum: { totalPrice: true },
    });

    return {
      overview: {
        activeListings,
        totalListings,
        pendingMatches,
        confirmedMatches,
        activeContracts,
        completedContracts,
        totalCarbonCredits: carbonCredits._count,
        co2Avoided: carbonCredits._sum.co2AvoidedTonnes || 0,
        revenue: revenueData._sum.totalPrice || 0,
        trustScore: company?.trustScore || 0.5,
      },
      recentContracts: recentTransactions,
    };
  }

  /**
   * Get admin platform-wide dashboard
   */
  async getAdminDashboard() {
    const [
      totalCompanies,
      verifiedCompanies,
      totalListings,
      activeListings,
      totalMatches,
      totalContracts,
      carbonStats,
      revenueStats,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { kybStatus: 'VERIFIED' } }),
      this.prisma.wasteListing.count(),
      this.prisma.wasteListing.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.match.count(),
      this.prisma.contract.count(),
      this.prisma.carbonCredit.aggregate({
        _sum: { co2AvoidedTonnes: true },
        _count: true,
      }),
      this.prisma.contract.aggregate({
        where: { status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
    ]);

    const totalRevenue = revenueStats._sum.totalPrice || 0;
    const platformCommission = totalRevenue * 0.04; // 4% commission

    return {
      platform: {
        totalCompanies,
        verifiedCompanies,
        pendingVerification: totalCompanies - verifiedCompanies,
        totalListings,
        activeListings,
        totalMatches,
        totalContracts,
        totalCarbonCredits: carbonStats._count,
        totalCO2Avoided: carbonStats._sum.co2AvoidedTonnes || 0,
        totalTransactionVolume: totalRevenue,
        platformRevenue: Math.round(platformCommission * 100) / 100,
      },
    };
  }
}
