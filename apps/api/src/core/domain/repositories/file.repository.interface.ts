import { FileDomainEntity } from '../entities/file.entity';

export interface IFileRepository {
  save(file: FileDomainEntity): Promise<FileDomainEntity>;
  findById(id: string): Promise<FileDomainEntity | null>;
  findByEntity(entityType: string, entityId: string): Promise<FileDomainEntity[]>;
  delete(id: string): Promise<void>;
}
