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
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response
  ) {
    const userId = req.user.id;
    const conversationId = dto.conversationId || randomUUID();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.on('error', (err) => {
      console.error('Response stream error:', err);
    });

    try {
      await this.aiService.processMessage(
        dto.message,
        dto.module || 'general',
        conversationId,
        userId,
        (token: string) => {
          const data = JSON.stringify({ type: 'token', token });
          const success = res.write(`data: ${data}\n\n`);
          if (!success) {
            console.warn('Failed to write token to response');
          }
        }
      );

      const success = res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      if (!success) {
        console.warn('Failed to write end marker');
      }
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const success = res.write(
        `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
      );
      if (!success) {
        console.warn('Failed to write error');
      }
      res.end();
    }
  }
}
