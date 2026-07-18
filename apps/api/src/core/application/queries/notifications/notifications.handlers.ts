import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetNotificationsQuery, GetUnreadCountQuery } from './notifications.queries';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetNotificationsQuery) {
    const where: any = { userId: query.userId };
    if (query.unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUnreadCountQuery) {
    const count = await this.prisma.notification.count({
      where: { userId: query.userId, isRead: false },
    });
    return { count };
  }
}
