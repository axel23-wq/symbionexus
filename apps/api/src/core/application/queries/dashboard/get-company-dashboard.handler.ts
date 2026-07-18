import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetCompanyDashboardQuery } from './get-company-dashboard.query';

@QueryHandler(GetCompanyDashboardQuery)
export class GetCompanyDashboardHandler implements IQueryHandler<GetCompanyDashboardQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCompanyDashboardQuery) {
    const { companyId } = query;
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
}
