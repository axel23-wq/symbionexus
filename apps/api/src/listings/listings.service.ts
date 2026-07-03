import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto, ListingFilterDto } from './dto/listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new waste listing
   */
  async create(userId: string, dto: CreateListingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    return this.prisma.wasteListing.create({
      data: {
        companyId: user.companyId,
        title: dto.title,
        materialType: dto.materialType,
        materialCategory: dto.materialCategory as any,
        description: dto.description,
        volumeKg: dto.volumeKg,
        frequency: dto.frequency as any,
        chemicalProfile: dto.chemicalProfile || undefined,
        pricePerKg: dto.pricePerKg,
        latitude: dto.latitude,
        longitude: dto.longitude,
        photos: dto.photos ? JSON.stringify(dto.photos) : "[]",
        status: 'DRAFT',
      },
      include: { company: true },
    });
  }

  /**
   * Get all listings with filters (marketplace)
   */
  async findAll(filters: ListingFilterDto) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 12;
    const where: any = {};

    // Material category filter
    if (filters.materialCategory) {
      where.materialCategory = filters.materialCategory;
    }

    // Status filter (default to PUBLISHED for marketplace)
    where.status = filters.status || 'PUBLISHED';

    // Volume range
    if (filters.minVolume || filters.maxVolume) {
      where.volumeKg = {};
      if (filters.minVolume) where.volumeKg.gte = filters.minVolume;
      if (filters.maxVolume) where.volumeKg.lte = filters.maxVolume;
    }

    // Search by title or material type
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { materialType: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.wasteListing.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true, companySector: true, companyCity: true, trustScore: true, logoUrl: true },
          },
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteListing.count({ where }),
    ]);

    // If geo filter requested, filter results by distance (Haversine)
    let filteredData = data;
    if (filters.latitude && filters.longitude && filters.radiusKm) {
      filteredData = data.filter((listing) => {
        const distance = this.haversineDistance(
          filters.latitude!, filters.longitude!,
          listing.latitude, listing.longitude,
        );
        return distance <= filters.radiusKm!;
      });
    }

    return {
      data: filteredData,
      meta: {
        total: filters.radiusKm ? filteredData.length : total,
        page,
        perPage,
        totalPages: Math.ceil((filters.radiusKm ? filteredData.length : total) / perPage),
      },
    };
  }

  /**
   * Get a single listing by ID
   */
  async findById(id: string) {
    const listing = await this.prisma.wasteListing.findUnique({
      where: { id },
      include: {
        company: true,
        matches: {
          include: { buyerCompany: true },
          take: 5,
          orderBy: { compatibilityScore: 'desc' },
        },
      },
    });
    if (!listing) throw new NotFoundException('Annonce non trouvée');
    return listing;
  }

  /**
   * Get listings by company
   */
  async findByCompany(companyId: string) {
    return this.prisma.wasteListing.findMany({
      where: { companyId },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a listing
   */
  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.findById(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || listing.companyId !== user.companyId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette annonce');
    }

    const dataToUpdate: any = { ...dto };
    if (dto.photos) {
      dataToUpdate.photos = JSON.stringify(dto.photos);
    }

    return this.prisma.wasteListing.update({
      where: { id },
      data: dataToUpdate,
      include: { company: true },
    });
  }

  /**
   * Publish a listing (DRAFT → PUBLISHED)
   */
  async publish(id: string, userId: string) {
    const listing = await this.findById(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || listing.companyId !== user.companyId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à publier cette annonce');
    }

    return this.prisma.wasteListing.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: { company: true },
    });
  }

  /**
   * Delete a listing
   */
  async remove(id: string, userId: string) {
    const listing = await this.findById(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || listing.companyId !== user.companyId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette annonce');
    }

    // Une annonce peut avoir des matchs → contrats → passeports → crédits carbone
    // + transactions + messages. Ces FK sont en RESTRICT : on supprime toute la
    // chaîne de dépendances de bas en haut, dans une transaction atomique.
    const matches = await this.prisma.match.findMany({
      where: { listingId: id },
      select: { id: true },
    });
    const matchIds = matches.map((m) => m.id);

    const contracts = matchIds.length
      ? await this.prisma.contract.findMany({
          where: { matchId: { in: matchIds } },
          select: { id: true },
        })
      : [];
    const contractIds = contracts.map((c) => c.id);

    const passports = contractIds.length
      ? await this.prisma.materialPassport.findMany({
          where: { contractId: { in: contractIds } },
          select: { id: true },
        })
      : [];
    const passportIds = passports.map((p) => p.id);

    await this.prisma.$transaction([
      this.prisma.carbonCredit.deleteMany({ where: { passportId: { in: passportIds } } }),
      this.prisma.materialPassport.deleteMany({ where: { id: { in: passportIds } } }),
      this.prisma.transaction.deleteMany({ where: { contractId: { in: contractIds } } }),
      this.prisma.contract.deleteMany({ where: { id: { in: contractIds } } }),
      this.prisma.message.deleteMany({ where: { matchId: { in: matchIds } } }),
      this.prisma.match.deleteMany({ where: { listingId: id } }),
      this.prisma.wasteListing.delete({ where: { id } }),
    ]);

    return { id };
  }

  /**
   * Haversine distance in km between two geo points
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
