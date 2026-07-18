export class PermissionEntity {
  constructor(
    public readonly id: string,
    public action: string,
    public description: string | null,
    public readonly createdAt: Date,
  ) {}
}

export class RoleEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public isSystem: boolean,
    public permissions: PermissionEntity[],
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
