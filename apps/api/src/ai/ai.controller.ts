import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { CreateChatMessageDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('chat')
  async chat(
    @Body() dto: CreateChatMessageDto,
    @Req() req: any,
    @Res() res: any
  ) {
    const userId = req.user.id;
    const conversationId = dto.conversationId || this.generateId();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.aiService.processMessage(
        dto.message,
        dto.module || 'general',
        conversationId,
        userId,
        (token: string) => {
          res.write(
            `data: ${JSON.stringify({ type: 'token', token })}\n\n`
          );
        }
      );

      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
      );
      res.end();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(7);
  }
}
