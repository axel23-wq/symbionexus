import { AuditLogEntity } from '../entities/audit-log.entity';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface IAuditLogRepository {
  save(auditLog: AuditLogEntity): Promise<void>;
  findByUserId(userId: string): Promise<AuditLogEntity[]>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]>;
}
