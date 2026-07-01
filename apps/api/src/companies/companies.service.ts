import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { companySector?: string; kybStatus?: string; page?: number; perPage?: number }) {
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const where: any = {};
    if (params?.companySector) where.companySector = params.companySector;
    if (params?.kybStatus) where.kybStatus = params.kybStatus;

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        listings: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { listings: true, contractsAsSeller: true, contractsAsBuyer: true } },
      },
    });
    if (!company) throw new NotFoundException('Entreprise non trouvée');
    return company;
  }

  async updateTrustScore(companyId: string) {
    // Calculate trust score from completed contracts and feedback
    const stats = await this.prisma.contract.aggregate({
      where: {
        OR: [{ sellerCompanyId: companyId }, { buyerCompanyId: companyId }],
        status: 'COMPLETED',
      },
      _count: true,
    });

    const totalContracts = stats._count || 0;
    // Simple trust formula: base 0.5 + 0.05 per completed contract, capped at 1.0
    const trustScore = Math.min(1.0, 0.5 + totalContracts * 0.05);

    return this.prisma.company.update({
      where: { id: companyId },
      data: { trustScore },
    });
  }
}
