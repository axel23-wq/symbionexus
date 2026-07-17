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
    this.logger.debug(`Creating message for conversation ${conversationId}, userId: ${userId}, role: ${role}`);

    // Create conversation if it doesn't exist
    let conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation && userId) {
      try {
        conversation = await this.prisma.conversation.create({
          data: {
            id: conversationId,
            userId,
            module: 'general',
          },
        });
        this.logger.log(`Created new conversation: ${conversationId} for user: ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to create conversation: ${error}`);
        throw error;
      }
    }

    if (!conversation) {
      this.logger.error(`Conversation ${conversationId} not found and userId not provided`);
      throw new Error(`Conversation ${conversationId} not found and cannot create without userId`);
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
      include: {
        messages: {
          take: 20,
          orderBy: { createdAt: 'asc' },
          select: { id: true, conversationId: true, role: true, content: true, createdAt: true }
        }
      },
    });
  }
}
