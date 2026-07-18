export class UpdateCompanyCommand {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly registrationNumber?: string,
    public readonly logoUrl?: string,
    public readonly description?: string,
  ) {}
}

export class UpdatePreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly locale?: string,
    public readonly theme?: string,
  ) {}
}

export class UpdateNotificationsCommand {
  constructor(
    public readonly userId: string,
    public readonly prefs: Record<string, boolean>,
  ) {}
}

export class AddCertificationCommand {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly fileUrl: string,
    public readonly expiresAt?: string,
    public readonly isVerified?: boolean,
  ) {}
}

export class DeleteCertificationCommand {
  constructor(
    public readonly userId: string,
    public readonly docId: string,
  ) {}
}
