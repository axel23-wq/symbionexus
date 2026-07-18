import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';

interface ScoreBreakdown {
  materialScore: number;
  distanceScore: number;
  volumeScore: number;
  trustScore: number;
  totalScore: number;
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private listingsService: ListingsService,
  ) {}

  /**
   * Run the matchmaking algorithm for a listing
   * Finds compatible buyer companies and scores them
   */
  async computeMatches(listingId: string, maxResults = 10, maxDistanceKm = 500) {
    const listing = await this.prisma.wasteListing.findUnique({
      where: { id: listingId },
      include: { company: true },
    });
    if (!listing) throw new NotFoundException('Annonce non trouvée');

    // Find all potential buyer companies (different company, BUYER role users)
    const buyerCompanies = await this.prisma.company.findMany({
      where: {
        id: { not: listing.companyId },
        users: { some: { role: { name: 'BUYER' } } },
        kybStatus: 'VERIFIED',
      },
    });

    // Score each buyer company
    const scoredMatches = buyerCompanies
      .map((buyer) => {
        const distanceKm = this.listingsService.haversineDistance(
          listing.latitude, listing.longitude,
          buyer.companyLatitude, buyer.companyLongitude,
        );

        // Skip if too far
        if (distanceKm > maxDistanceKm) return null;

        const scoreBreakdown = this.calculateScore(listing, buyer, distanceKm);

        return {
          buyerCompanyId: buyer.id,
          buyerCompany: buyer,
          distanceKm: Math.round(distanceKm * 10) / 10,
          scoreBreakdown,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.scoreBreakdown.totalScore - a!.scoreBreakdown.totalScore)
      .slice(0, maxResults);

    // Store matches in database
    const matches = [];
    for (const match of scoredMatches) {
      if (!match) continue;

      const existingMatch = await this.prisma.match.findUnique({
        where: {
          listingId_buyerCompanyId: {
            listingId: listing.id,
            buyerCompanyId: match.buyerCompanyId,
          },
        },
      });

      if (existingMatch) {
        // Update existing match score
        const updated = await this.prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            compatibilityScore: match.scoreBreakdown.totalScore,
            scoreBreakdown: match.scoreBreakdown as any,
            distanceKm: match.distanceKm,
          },
          include: { buyerCompany: true, sellerCompany: true, listing: true },
        });
        matches.push(updated);
      } else {
        // Create new match
        const created = await this.prisma.match.create({
          data: {
            listingId: listing.id,
            buyerCompanyId: match.buyerCompanyId,
            sellerCompanyId: listing.companyId,
            compatibilityScore: match.scoreBreakdown.totalScore,
            scoreBreakdown: match.scoreBreakdown as any,
            distanceKm: match.distanceKm,
            status: 'PROPOSED',
          },
          include: { buyerCompany: true, sellerCompany: true, listing: true },
        });
        matches.push(created);
      }
    }

    // Update listing status
    if (matches.length > 0) {
      await this.prisma.wasteListing.update({
        where: { id: listingId },
        data: { status: 'MATCHED' },
      });
    }

    return matches;
  }

  /**
   * Multi-criteria scoring algorithm
   * Weights: material 40%, distance 25%, volume 20%, trust 15%
   */
  private calculateScore(listing: any, buyer: any, distanceKm: number): ScoreBreakdown {
    // 1. Material compatibility (40%)
    // Exact sector match = 1.0, related sector = 0.6
    const sectorMap: Record<string, string[]> = {
      Agroalimentaire: ['Compostage', 'Bioénergie', 'Chimie verte', 'Agriculture'],
      Plasturgie: ['Recyclage plastique', 'Injection', 'Extrusion'],
      Métallurgie: ['Fonderie', 'Recyclage métaux', 'Sidérurgie'],
      Textile: ['Recyclage textile', 'Isolation', 'Non-tissé'],
      BTP: ['Recyclage BTP', 'Remblais', 'Granulats'],
    };

    let materialScore = 0.3; // base score
    const relatedSectors = sectorMap[listing.company.companySector] || [];
    if (buyer.companySector === listing.company.companySector) {
      materialScore = 0.8;
    } else if (relatedSectors.includes(buyer.companySector)) {
      materialScore = 1.0;
    } else if (buyer.companySector.toLowerCase().includes('recycl')) {
      materialScore = 0.7;
    }

    // 2. Geographic proximity (25%)
    // Score = 1 - (distance / maxRadius), minimum 0
    const maxRadius = 500;
    const distanceScore = Math.max(0, 1 - distanceKm / maxRadius);

    // 3. Volume compatibility (20%)
    // Assume buyer needs roughly the same volume range
    const volumeScore = 0.7; // Default assumption since we don't store buyer needs yet

    // 4. Trust score (15%)
    const trustScoreValue = buyer.trustScore || 0.5;

    // Weighted total
    const totalScore = Math.round(
      (materialScore * 0.40 + distanceScore * 0.25 + volumeScore * 0.20 + trustScoreValue * 0.15) * 100,
    );

    return {
      materialScore: Math.round(materialScore * 100),
      distanceScore: Math.round(distanceScore * 100),
      volumeScore: Math.round(volumeScore * 100),
      trustScore: Math.round(trustScoreValue * 100),
      totalScore,
    };
  }

  /**
   * Get matches for a company (as buyer or seller)
   */
  async findByCompany(companyId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
      },
      include: {
        listing: true,
        buyerCompany: true,
        sellerCompany: true,
      },
      orderBy: { compatibilityScore: 'desc' },
    });
  }

  /**
   * Get a single match
   */
  async findById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        listing: { include: { company: true } },
        buyerCompany: true,
        sellerCompany: true,
        contract: true,
      },
    });
    if (!match) throw new NotFoundException('Match non trouvé');
    return match;
  }

  /**
   * Accept a match (seller or buyer side)
   */
  async acceptMatch(matchId: string, userId: string) {
    const match = await this.findById(matchId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let newStatus = match.status;

    if (user.companyId === match.sellerCompanyId) {
      newStatus = match.status === 'ACCEPTED_BUYER' ? 'CONFIRMED' : 'ACCEPTED_SELLER';
    } else if (user.companyId === match.buyerCompanyId) {
      newStatus = match.status === 'ACCEPTED_SELLER' ? 'CONFIRMED' : 'ACCEPTED_BUYER';
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: newStatus },
      include: { listing: true, buyerCompany: true, sellerCompany: true },
    });
  }

  /**
   * Reject a match
   */
  async rejectMatch(matchId: string) {
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'REJECTED' },
    });
  }
}
