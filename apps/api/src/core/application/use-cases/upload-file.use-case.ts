import { Inject, Injectable } from '@nestjs/common';
import { IFileRepository } from '../../domain/repositories/file.repository.interface';
import { IFileStorageService } from '../../domain/services/file-storage.interface';
import { FileDomainEntity } from '../../domain/entities/file.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileCommand {
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  uploaderId: string;
  companyId?: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class UploadFileUseCase {
  constructor(
    @Inject('IFileRepository')
    private readonly fileRepository: IFileRepository,
    @Inject('IFileStorageService')
    private readonly storageService: IFileStorageService,
  ) {}

  async execute(command: UploadFileCommand): Promise<FileDomainEntity> {
    // 1. Upload to storage (S3 or Local)
    const uploadResult = await this.storageService.uploadFile(
      command.fileBuffer,
      command.originalName,
      command.mimeType,
    );

    // 2. Save metadata to DB
    const fileEntity = new FileDomainEntity(
      uuidv4(),
      uploadResult.filename,
      command.originalName,
      command.mimeType,
      uploadResult.sizeBytes,
      uploadResult.url,
      command.uploaderId,
      command.companyId,
      command.entityType,
      command.entityId,
    );

    return this.fileRepository.save(fileEntity);
  }
}
