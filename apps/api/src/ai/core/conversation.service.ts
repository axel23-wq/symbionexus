import { Injectable, Logger } from '@nestjs/common';
import { Message } from './types';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);
  private conversations = new Map<string, Message[]>();

  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    userId?: string
  ): Promise<Message> {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }

    const message: Message = {
      id: Math.random().toString(36).substring(7),
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };

    this.conversations.get(conversationId)!.push(message);
    this.logger.debug(
      `Saved ${role} message to conversation ${conversationId}`
    );

    return message;
  }

  async getHistory(conversationId: string): Promise<Message[]> {
    return this.conversations.get(conversationId) || [];
  }
}
