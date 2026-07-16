import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from './provider.interface';
import { ClaudeProvider } from './claude.provider';
import { GroqProvider } from './groq.provider';

@Injectable()
export class ProviderFactory {
  private logger = new Logger(ProviderFactory.name);

  create(): AIProvider {
    const providerType = (process.env.AI_PROVIDER || 'claude').toLowerCase();

    switch (providerType) {
      case 'claude':
        this.logger.log('Using Claude provider');
        return new ClaudeProvider();
      case 'groq':
        this.logger.log('Using Groq provider');
        return new GroqProvider();
      // TODO: Ollama, OpenAI stubs (post-MVP)
      default:
        throw new Error(`Unknown AI provider: ${providerType}`);
    }
  }
}
