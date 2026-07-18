import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { RoleEntity, PermissionEntity } from '../../domain/entities/role.entity';

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) return null;
    return this.toDomain(role);
  }

  async findAll(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    return roles.map((r) => this.toDomain(r));
  }

  async save(role: RoleEntity): Promise<void> {
    // Basic upsert, in a real implementation we would sync the many-to-many relationship
    await this.prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        updatedAt: role.updatedAt,
      },
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  }

  private toDomain(prismaRole: any): RoleEntity {
    const permissions = prismaRole.permissions
      ? prismaRole.permissions.map(
          (rp: any) =>
            new PermissionEntity(
              rp.permission.id,
              rp.permission.action,
              rp.permission.description,
              rp.permission.createdAt,
            ),
        )
      : [];

    return new RoleEntity(
      prismaRole.id,
      prismaRole.name,
      prismaRole.description,
      prismaRole.isSystem,
      permissions,
      prismaRole.createdAt,
      prismaRole.updatedAt,
    );
  }
}
