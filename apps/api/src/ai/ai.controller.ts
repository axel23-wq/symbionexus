import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('chat')
  async chat(
    @Body() dto: CreateChatMessageDto,
    @Req() req: Request & { user: { sub: string; email: string; role: string; companyId: string } },
    @Res() res: Response
  ) {
    const userId = req.user.sub;
    const conversationId = dto.conversationId || randomUUID();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.on('error', (err) => {
      console.error('Response stream error:', err);
    });

    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Réponse dépassée (>30s)' })}\n\n`);
        res.end();
      }
    }, 30000);

    try {
      if (!dto.message || dto.message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      await this.aiService.processMessage(
        dto.message,
        dto.module || 'general',
        conversationId,
        userId,
        (token: string) => {
          const data = JSON.stringify({ type: 'token', token });
          if (!res.writableEnded) {
            res.write(`data: ${data}\n\n`);
          }
        }
      );

      clearTimeout(timeout);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
        res.end();
      }
    } catch (error) {
      clearTimeout(timeout);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        res.end();
      }
    }
  }
}
