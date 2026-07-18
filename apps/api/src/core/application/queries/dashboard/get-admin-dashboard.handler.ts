import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetAdminDashboardQuery } from './get-admin-dashboard.query';

@QueryHandler(GetAdminDashboardQuery)
export class GetAdminDashboardHandler implements IQueryHandler<GetAdminDashboardQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAdminDashboardQuery) {
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
