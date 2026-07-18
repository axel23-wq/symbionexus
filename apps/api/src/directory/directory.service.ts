import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  async searchDirectory(params: {
    query?: string;
    materialCategory?: string;
    region?: string;
    subdivision?: string;
    activities?: string[];
    minCapacityKg?: number;
    hasCollectionService?: boolean;
    page?: number;
    perPage?: number;
  }) {
    const {
      query,
      materialCategory,
      region,
      subdivision,
      activities,
      minCapacityKg,
      hasCollectionService,
      page = 1,
      perPage = 50,
    } = params;

    const where: any = {
      // For now, let's just show those that have a profile attached
      profile: {
        isNot: null,
      },
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { companySector: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (region) {
      where.profile = { ...where.profile, region };
    }
    if (subdivision) {
      where.profile = { ...where.profile, subdivision };
    }
    if (activities && activities.length > 0) {
      where.profile = { ...where.profile, activities: { hasSome: activities } };
    }

    if (materialCategory) {
      where.procurement = {
        materialsAccepted: {
          has: materialCategory,
        },
      };
    }

    if (minCapacityKg) {
      where.capacity = {
        monthlyCapacityKg: { gte: minCapacityKg },
      };
    }

    if (hasCollectionService) {
      where.logistics = {
        collectionService: true,
      };
    }

    const total = await this.prisma.company.count({ where });

    const companies = await this.prisma.company.findMany({
      where,
      include: {
        profile: true,
        capacity: true,
        procurement: true,
        logistics: true,
        digitalAssets: true,
        compliance: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: {
        trustScore: 'desc',
      },
    });

    return {
      total,
      page,
      perPage,
      data: companies,
    };
  }

  async getCompanyDetails(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        profile: true,
        capacity: true,
        procurement: true,
        logistics: true,
        digitalAssets: true,
        compliance: true,
      },
    });
  }
}
