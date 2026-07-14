import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ChatOptions } from './provider.interface';

@Injectable()
export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model = 'claude-3-5-sonnet-20241022';
  private logger = new Logger(ClaudeProvider.name);

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(prompt: string, options?: ChatOptions): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      if (response.content[0].type === 'text') {
        return response.content[0].text;
      }
      return '';
    } catch (error) {
      this.logger.error('Claude chat error:', error);
      throw error;
    }
  }

  async streamChat(
    prompt: string,
    onToken: (token: string) => void,
    options?: ChatOptions
  ): Promise<void> {
    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          onToken(event.delta.text);
        }
      }
    } catch (error) {
      this.logger.error('Claude stream error:', error);
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    // TODO: Implement with Claude embeddings API (Task 9+)
    return Array(1536).fill(0);
  }

  getModel(): string {
    return this.model;
  }
}
