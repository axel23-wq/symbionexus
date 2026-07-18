export class FileDomainEntity {
  constructor(
    public readonly id: string,
    public readonly filename: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly url: string,
    public readonly uploaderId: string,
    public readonly companyId?: string | null,
    public readonly entityType?: string | null,
    public readonly entityId?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
