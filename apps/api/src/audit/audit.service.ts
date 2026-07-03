import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditStatusValue = 'SUCCESS' | 'FAILURE';

/**
 * Journal d'audit de sécurité. `log()` ne lève jamais d'erreur :
 * un échec de journalisation ne doit pas casser le flux métier appelant.
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    ipAddress?: string | null,
    status: AuditStatusValue = 'SUCCESS',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress: ipAddress ?? null,
          status,
          metadata: metadata ? (metadata as any) : undefined,
        },
      });
    } catch {
      // silencieux : la journalisation ne doit jamais interrompre l'action principale
    }
  }

  async list(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
