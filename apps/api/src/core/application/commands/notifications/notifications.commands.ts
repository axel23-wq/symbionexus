import { NotificationType } from '@prisma/client';

export class CreateNotificationCommand {
  constructor(
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly data?: Record<string, any>,
  ) {}
}

export class MarkNotificationReadCommand {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}

export class MarkAllNotificationsReadCommand {
  constructor(public readonly userId: string) {}
}
