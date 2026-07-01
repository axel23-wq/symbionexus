import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  async send(
    @Req() req: any,
    @Body() body: { receiverCompanyId: string; content: string; matchId?: string },
  ) {
    const user = await this.messagingService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const message = await this.messagingService.sendMessage(
      user!.companyId, body.receiverCompanyId, body.content, body.matchId,
    );
    return { success: true, data: message };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister mes conversations' })
  async getConversations(@Req() req: any) {
    const user = await this.messagingService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const conversations = await this.messagingService.getConversations(user!.companyId);
    return { success: true, data: conversations };
  }

  @Get('conversation/:partnerId')
  @ApiOperation({ summary: 'Messages d\'une conversation' })
  async getConversation(@Req() req: any, @Param('partnerId') partnerId: string) {
    const user = await this.messagingService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const messages = await this.messagingService.getConversation(user!.companyId, partnerId);
    return { success: true, data: messages };
  }

  @Patch('read/:partnerId')
  @ApiOperation({ summary: 'Marquer les messages comme lus' })
  async markAsRead(@Req() req: any, @Param('partnerId') partnerId: string) {
    const user = await this.messagingService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    await this.messagingService.markAsRead(user!.companyId, partnerId);
    return { success: true, message: 'Messages marqués comme lus' };
  }
}
