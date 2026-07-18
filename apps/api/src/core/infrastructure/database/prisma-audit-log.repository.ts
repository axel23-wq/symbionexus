import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLogEntity, AuditStatus } from '../../domain/entities/audit-log.entity';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(auditLog: AuditLogEntity): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        status: auditLog.status as any,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        oldData: auditLog.oldData ? JSON.parse(JSON.stringify(auditLog.oldData)) : null,
        newData: auditLog.newData ? JSON.parse(JSON.stringify(auditLog.newData)) : null,
        ipAddress: auditLog.ipAddress,
        metadata: auditLog.metadata ? JSON.parse(JSON.stringify(auditLog.metadata)) : null,
        createdAt: auditLog.createdAt,
      },
    });
  }

  async findByUserId(userId: string): Promise<AuditLogEntity[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log: any) => this.toDomain(log));
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log: any) => this.toDomain(log));
  }

  private toDomain(prismaLog: any): AuditLogEntity {
    return new AuditLogEntity(
      prismaLog.id,
      prismaLog.userId,
      prismaLog.action,
      prismaLog.status as AuditStatus,
      prismaLog.entityType,
      prismaLog.entityId,
      prismaLog.oldData,
      prismaLog.newData,
      prismaLog.ipAddress,
      prismaLog.metadata,
      prismaLog.createdAt,
    );
  }
}
