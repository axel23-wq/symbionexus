export class GetNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly unreadOnly: boolean = false,
  ) {}
}

export class GetUnreadCountQuery {
  constructor(public readonly userId: string) {}
}
