import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto, AddCertificationDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: { include: { complianceDocuments: { orderBy: { createdAt: 'desc' } } } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        locale: user.locale,
        theme: user.theme,
        notificationPrefs: user.notificationPrefs,
      },
      company: user.company,
    };
  }

  async updateNotifications(userId: string, prefs: Record<string, boolean>) {
    await this.prisma.user.update({ where: { id: userId }, data: { notificationPrefs: prefs as any } });
    return { success: true, prefs };
  }

  async updatePreferences(userId: string, data: { locale?: string; theme?: string }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { ...(data.locale ? { locale: data.locale } : {}), ...(data.theme ? { theme: data.theme } : {}) },
    });
    return { success: true };
  }

  private async companyIdOf(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user.companyId;
  }

  async updateCompany(userId: string, dto: UpdateCompanyDto) {
    const companyId = await this.companyIdOf(userId);
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.registrationNumber !== undefined ? { registrationNumber: dto.registrationNumber } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return { success: true, company };
  }

  async updateWebhook(userId: string, webhookUrl: string | undefined) {
    const companyId = await this.companyIdOf(userId);
    await this.prisma.company.update({ where: { id: companyId }, data: { webhookUrl: webhookUrl ?? null } });
    return { success: true, webhookUrl: webhookUrl ?? null };
  }

  /** Ajoute une certification (document) et améliore légèrement le Trust Score. */
  async addCertification(userId: string, dto: AddCertificationDto) {
    const companyId = await this.companyIdOf(userId);
    const doc = await this.prisma.complianceDocument.create({
      data: {
        companyId,
        type: dto.type,
        title: dto.title,
        fileUrl: dto.fileUrl,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isVerified: dto.isVerified ?? false,
      },
    });
    // Le dépôt de certifications alimente le Trust Score (plafonné à 1.0)
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { trustScore: true } });
    const newScore = Math.min(1, (company?.trustScore ?? 0.5) + 0.02);
    await this.prisma.company.update({ where: { id: companyId }, data: { trustScore: newScore } });
    return { success: true, document: doc, trustScore: newScore };
  }

  async deleteCertification(userId: string, docId: string) {
    const companyId = await this.companyIdOf(userId);
    const doc = await this.prisma.complianceDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.companyId !== companyId) throw new NotFoundException('Document introuvable');
    await this.prisma.complianceDocument.delete({ where: { id: docId } });
    return { success: true };
  }
}
