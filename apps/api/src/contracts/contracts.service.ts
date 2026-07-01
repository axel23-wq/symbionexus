import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Auto-generate a contract from a confirmed match
   */
  async generateFromMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true, buyerCompany: true, sellerCompany: true },
    });
    if (!match) throw new NotFoundException('Match non trouvé');

    // Check if contract already exists
    const existing = await this.prisma.contract.findUnique({ where: { matchId } });
    if (existing) return existing;

    const pricePerKg = match.listing.pricePerKg || 0.10; // default price
    const totalPrice = match.listing.volumeKg * pricePerKg;

    return this.prisma.contract.create({
      data: {
        matchId: match.id,
        sellerCompanyId: match.sellerCompanyId,
        buyerCompanyId: match.buyerCompanyId,
        volumeEngagedKg: match.listing.volumeKg,
        pricePerKg,
        totalPrice,
        durationMonths: 6,
        frequency: match.listing.frequency,
        status: 'PENDING_SIGNATURES',
        transportConditions: {
          pickupAddress: match.sellerCompany.companyAddress,
          deliveryAddress: match.buyerCompany.companyAddress,
          maxTransitDays: 3,
        },
      },
      include: {
        match: { include: { listing: true } },
        sellerCompany: true,
        buyerCompany: true,
      },
    });
  }

  /**
   * Sign a contract (seller or buyer)
   */
  async signContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Contrat non trouvé');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updates: any = {};

    if (user.companyId === contract.sellerCompanyId) {
      updates.sellerSigned = true;
    } else if (user.companyId === contract.buyerCompanyId) {
      updates.buyerSigned = true;
    }

    // Check if both signed
    const sellerSigned = updates.sellerSigned || contract.sellerSigned;
    const buyerSigned = updates.buyerSigned || contract.buyerSigned;

    if (sellerSigned && buyerSigned) {
      updates.status = 'SIGNED';
      updates.signedAt = new Date();
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: updates,
      include: {
        match: { include: { listing: true } },
        sellerCompany: true,
        buyerCompany: true,
        materialPassports: true,
      },
    });
  }

  /**
   * Get contract by ID
   */
  async findById(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        match: { include: { listing: true } },
        sellerCompany: true,
        buyerCompany: true,
        materialPassports: true,
        transactions: true,
      },
    });
    if (!contract) throw new NotFoundException('Contrat non trouvé');
    return contract;
  }

  /**
   * Get contracts for a company
   */
  async findByCompany(companyId: string) {
    return this.prisma.contract.findMany({
      where: {
        OR: [{ sellerCompanyId: companyId }, { buyerCompanyId: companyId }],
      },
      include: {
        match: { include: { listing: true } },
        sellerCompany: true,
        buyerCompany: true,
        _count: { select: { materialPassports: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
