import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
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
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response
  ) {
    const userId = req.user.id;
    const conversationId = dto.conversationId || this.generateId();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      res.on('error', (err) => {
        console.error('Response stream error:', err);
      });

      await this.aiService.processMessage(
        dto.message,
        dto.module || 'general',
        conversationId,
        userId,
        (token: string) => {
          const chunk = `data: ${JSON.stringify({ type: 'token', token })}\n\n`;
          if (!res.write(chunk)) {
            console.warn('Failed to write token chunk to response');
          }
        }
      );

      const endChunk = `data: ${JSON.stringify({ type: 'end' })}\n\n`;
      if (!res.write(endChunk)) {
        console.warn('Failed to write end chunk to response');
      }
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorChunk = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`;
      if (!res.write(errorChunk)) {
        console.warn('Failed to write error chunk to response');
      }
      res.end();
    }
  }

  private generateId(): string {
    return randomUUID();
  }
}
