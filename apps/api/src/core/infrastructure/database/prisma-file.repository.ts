import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IFileRepository } from '../../domain/repositories/file.repository.interface';
import { FileDomainEntity } from '../../domain/entities/file.entity';

@Injectable()
export class PrismaFileRepository implements IFileRepository {
  constructor(private prisma: PrismaService) {}

  async save(file: FileDomainEntity): Promise<FileDomainEntity> {
    const saved = await this.prisma.fileEntity.create({
      data: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        url: file.url,
        uploaderId: file.uploaderId,
        companyId: file.companyId,
        entityType: file.entityType,
        entityId: file.entityId,
      },
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<FileDomainEntity | null> {
    const file = await this.prisma.fileEntity.findUnique({ where: { id } });
    if (!file) return null;
    return this.toDomain(file);
  }

  async findByEntity(entityType: string, entityId: string): Promise<FileDomainEntity[]> {
    const files = await this.prisma.fileEntity.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
    return files.map((f: any) => this.toDomain(f));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fileEntity.delete({ where: { id } });
  }

  private toDomain(prismaFile: any): FileDomainEntity {
    return new FileDomainEntity(
      prismaFile.id,
      prismaFile.filename,
      prismaFile.originalName,
      prismaFile.mimeType,
      prismaFile.sizeBytes,
      prismaFile.url,
      prismaFile.uploaderId,
      prismaFile.companyId,
      prismaFile.entityType,
      prismaFile.entityId,
      prismaFile.createdAt,
      prismaFile.updatedAt,
    );
  }
}
