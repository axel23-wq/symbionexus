import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Message } from './types';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);

  constructor(private prisma: PrismaService) {}

  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    userId?: string
  ): Promise<Message> {
    // Create conversation if it doesn't exist
    let conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation && userId) {
      conversation = await this.prisma.conversation.create({
        data: {
          id: conversationId,
          userId,
          module: 'general',
        },
      });
      this.logger.debug(`Created new conversation: ${conversationId}`);
    }

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        role,
        content,
      },
    });

    this.logger.debug(
      `Saved ${role} message to conversation ${conversationId}`
    );

    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  async getHistory(conversationId: string): Promise<Message[]> {
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }

  async getConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { take: 20, orderBy: { createdAt: 'asc' } } },
    });
  }
}
