import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAuditLogRepository, AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditEventSubscriber {
  private readonly logger = new Logger(AuditEventSubscriber.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  @OnEvent('**', { async: true })
  async handleAllDomainEvents(payload: any) {
    try {
      // Check if it's a known domain event format
      if (!payload || !payload.eventName) {
        return; // Ignore non-domain events
      }

      const auditLog = new AuditLogEntity(
        uuidv4(),
        payload.userId || 'SYSTEM', // Fallback to SYSTEM if no user is provided
        payload.eventName,
        'SUCCESS',
        payload.entityType || null,
        payload.entityId || null,
        payload.oldData || null,
        payload.newData || null,
        payload.ipAddress || null,
        payload.metadata || null,
        new Date(),
      );

      await this.auditRepository.save(auditLog);
      this.logger.debug(`Audit log saved for event: ${payload.eventName}`);
    } catch (error) {
      this.logger.error(`Failed to save audit log for event: ${payload?.eventName}`, error);
    }
  }
}
