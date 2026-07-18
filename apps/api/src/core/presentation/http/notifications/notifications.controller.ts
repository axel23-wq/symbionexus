import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { GetNotificationsQuery, GetUnreadCountQuery } from '../../../application/queries/notifications/notifications.queries';
import {
  CreateNotificationCommand,
  MarkNotificationReadCommand,
  MarkAllNotificationsReadCommand,
} from '../../../application/commands/notifications/notifications.commands';
import { NotificationType } from '@prisma/client';

@ApiTags('notifications (core)')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsCoreController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les notifications' })
  async getNotifications(@Req() req: any, @Query('unreadOnly') unreadOnly?: boolean) {
    return this.queryBus.execute(new GetNotificationsQuery(req.user.sub, !!unreadOnly));
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtenir le nombre de notifications non lues' })
  async getUnreadCount(@Req() req: any) {
    return this.queryBus.execute(new GetUnreadCountQuery(req.user.sub));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.commandBus.execute(new MarkNotificationReadCommand(id, req.user.sub));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead(@Req() req: any) {
    return this.commandBus.execute(new MarkAllNotificationsReadCommand(req.user.sub));
  }

  // Route de test pour la démo WebSocket (Idéalement ceci devrait être appelé par le backend en interne)
  @Post('test-create')
  @ApiOperation({ summary: 'Créer une notification (utilitaire de test)' })
  async testCreateNotification(@Req() req: any, @Body() body: any) {
    return this.commandBus.execute(new CreateNotificationCommand(
      req.user.sub,
      body.type as NotificationType || NotificationType.NEW_MATCH,
      body.title || 'Notification Test',
      body.message || 'Ceci est un test de WebSocket.',
      body.data,
    ));
  }
}
