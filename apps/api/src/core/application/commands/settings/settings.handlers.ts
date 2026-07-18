import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  UpdateCompanyCommand,
  UpdatePreferencesCommand,
  UpdateNotificationsCommand,
  AddCertificationCommand,
  DeleteCertificationCommand,
} from './settings.commands';

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(command: UpdateCompanyCommand) {
    const user = await this.prisma.user.findUnique({ where: { id: command.userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(command.name !== undefined ? { name: command.name } : {}),
        ...(command.registrationNumber !== undefined ? { registrationNumber: command.registrationNumber } : {}),
        ...(command.logoUrl !== undefined ? { logoUrl: command.logoUrl } : {}),
        ...(command.description !== undefined ? { description: command.description } : {}),
      },
    });
    return { success: true, company };
  }
}

@CommandHandler(UpdatePreferencesCommand)
export class UpdatePreferencesHandler implements ICommandHandler<UpdatePreferencesCommand> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(command: UpdatePreferencesCommand) {
    await this.prisma.user.update({
      where: { id: command.userId },
      data: {
        ...(command.locale ? { locale: command.locale } : {}),
        ...(command.theme ? { theme: command.theme } : {}),
      },
    });
    return { success: true };
  }
}

@CommandHandler(UpdateNotificationsCommand)
export class UpdateNotificationsHandler implements ICommandHandler<UpdateNotificationsCommand> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(command: UpdateNotificationsCommand) {
    await this.prisma.user.update({
      where: { id: command.userId },
      data: { notificationPrefs: command.prefs as any },
    });
    return { success: true, prefs: command.prefs };
  }
}

@CommandHandler(AddCertificationCommand)
export class AddCertificationHandler implements ICommandHandler<AddCertificationCommand> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(command: AddCertificationCommand) {
    const user = await this.prisma.user.findUnique({ where: { id: command.userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    
    const doc = await this.prisma.complianceDocument.create({
      data: {
        companyId: user.companyId,
        type: command.type,
        title: command.title,
        fileUrl: command.fileUrl,
        expiresAt: command.expiresAt ? new Date(command.expiresAt) : null,
        isVerified: command.isVerified ?? false,
      },
    });

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const newScore = Math.min(1, (company?.trustScore ?? 0.5) + 0.02);
    await this.prisma.company.update({ where: { id: user.companyId }, data: { trustScore: newScore } });
    return { success: true, document: doc, trustScore: newScore };
  }
}

@CommandHandler(DeleteCertificationCommand)
export class DeleteCertificationHandler implements ICommandHandler<DeleteCertificationCommand> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(command: DeleteCertificationCommand) {
    const user = await this.prisma.user.findUnique({ where: { id: command.userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    
    const doc = await this.prisma.complianceDocument.findUnique({ where: { id: command.docId } });
    if (!doc || doc.companyId !== user.companyId) throw new NotFoundException('Document introuvable');
    
    await this.prisma.complianceDocument.delete({ where: { id: command.docId } });
    return { success: true };
  }
}
