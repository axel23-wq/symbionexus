import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from './provider.interface';
import { ClaudeProvider } from './claude.provider';
import { GroqProvider } from './groq.provider';
import { MockProvider } from './mock.provider';

@Injectable()
export class ProviderFactory {
  private logger = new Logger(ProviderFactory.name);

  create(): AIProvider {
    const providerType = (process.env.AI_PROVIDER || 'mock').toLowerCase();

    switch (providerType) {
      case 'claude':
        try {
          this.logger.log('Using Claude provider');
          return new ClaudeProvider();
        } catch (error) {
          this.logger.warn('Claude provider failed, falling back to Mock:', error.message);
          return new MockProvider();
        }
      case 'groq':
        try {
          this.logger.log('Using Groq provider');
          return new GroqProvider();
        } catch (error) {
          this.logger.warn('Groq provider failed, falling back to Mock:', error.message);
          return new MockProvider();
        }
      case 'mock':
        this.logger.log('Using Mock provider (demo mode)');
        return new MockProvider();
      // TODO: Ollama, OpenAI stubs (post-MVP)
      default:
        this.logger.warn(`Unknown AI provider: ${providerType}, using Mock`);
        return new MockProvider();
    }
  }
}
