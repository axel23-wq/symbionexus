import { RoleEntity } from '../entities/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface IRoleRepository {
  findByName(name: string): Promise<RoleEntity | null>;
  save(role: RoleEntity): Promise<void>;
  findAll(): Promise<RoleEntity[]>;
}
