import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetPlatformAnalyticsQuery, GetCompanyAnalyticsQuery } from './analytics.queries';
import { ListingStatus, ContractStatus, CarbonCreditStatus } from '@prisma/client';

@QueryHandler(GetPlatformAnalyticsQuery)
export class GetPlatformAnalyticsHandler implements IQueryHandler<GetPlatformAnalyticsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPlatformAnalyticsQuery) {
    // Analytics plateforme (Admins)
    const [totalListings, totalContracts, carbonCredits] = await Promise.all([
      this.prisma.wasteListing.count({ where: { status: ListingStatus.PUBLISHED } }),
      this.prisma.contract.count({ where: { status: ContractStatus.IN_PROGRESS } }),
      this.prisma.carbonCredit.aggregate({
        _sum: { co2AvoidedTonnes: true },
        where: { marketStatus: CarbonCreditStatus.GENERATED },
      }),
    ]);

    // Trend calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newContractsLast30Days = await this.prisma.contract.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      totalActiveListings: totalListings,
      totalActiveContracts: totalContracts,
      totalCO2Avoided: carbonCredits._sum?.co2AvoidedTonnes || 0,
      newContractsLast30Days,
    };
  }
}

@QueryHandler(GetCompanyAnalyticsQuery)
export class GetCompanyAnalyticsHandler implements IQueryHandler<GetCompanyAnalyticsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCompanyAnalyticsQuery) {
    // Analytics propres à l'entreprise
    const { companyId } = query;

    const [listingsAsSeller, contractsAsBuyer, contractsAsSeller, carbonCredits] = await Promise.all([
      this.prisma.wasteListing.count({ where: { companyId } }),
      this.prisma.contract.count({ where: { buyerCompanyId: companyId } }),
      this.prisma.contract.count({ where: { sellerCompanyId: companyId } }),
      this.prisma.carbonCredit.aggregate({
        _sum: { co2AvoidedTonnes: true },
        where: { companyId },
      }),
    ]);

    const totalContracts = contractsAsBuyer + contractsAsSeller;

    return {
      companyId,
      totalListingsPosted: listingsAsSeller,
      totalContractsParticipated: totalContracts,
      totalCO2AvoidedOwned: carbonCredits._sum?.co2AvoidedTonnes || 0,
    };
  }
}
