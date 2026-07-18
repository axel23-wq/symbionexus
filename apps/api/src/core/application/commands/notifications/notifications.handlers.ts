import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationsGateway } from '../../../presentation/ws/notifications.gateway';
import { NotFoundException } from '@nestjs/common';
import {
  CreateNotificationCommand,
  MarkNotificationReadCommand,
  MarkAllNotificationsReadCommand,
} from './notifications.commands';

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: NotificationsGateway,
  ) {}

  async execute(command: CreateNotificationCommand) {
    // 1. Persist notification in DB
    const notification = await this.prisma.notification.create({
      data: {
        userId: command.userId,
        type: command.type,
        title: command.title,
        message: command.message,
        data: command.data || {},
      },
    });

    // 2. Emit real-time event via WebSocket
    this.wsGateway.sendNotificationToUser(command.userId, notification);

    return notification;
  }
}

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: MarkNotificationReadCommand) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: command.notificationId },
    });

    if (!notification || notification.userId !== command.userId) {
      throw new NotFoundException('Notification non trouvée');
    }

    return this.prisma.notification.update({
      where: { id: command.notificationId },
      data: { isRead: true },
    });
  }
}

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadHandler implements ICommandHandler<MarkAllNotificationsReadCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: MarkAllNotificationsReadCommand) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: command.userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, count: result.count };
  }
}
