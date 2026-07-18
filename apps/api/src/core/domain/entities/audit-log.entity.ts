export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

export class AuditLogEntity {
  constructor(
    public readonly id: string,
    public userId: string,
    public action: string,
    public status: AuditStatus,
    public entityType: string | null,
    public entityId: string | null,
    public oldData: any | null,
    public newData: any | null,
    public ipAddress: string | null,
    public metadata: any | null,
    public readonly createdAt: Date,
  ) {}
}
