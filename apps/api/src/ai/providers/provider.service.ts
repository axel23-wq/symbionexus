import { Injectable } from '@nestjs/common';
import { AIProvider, ChatOptions } from './provider.interface';
import { ProviderFactory } from './provider.factory';

@Injectable()
export class ProviderService {
  private provider: AIProvider;

  constructor(private factory: ProviderFactory) {
    this.provider = this.factory.create();
  }

  async chat(prompt: string, options?: ChatOptions): Promise<string> {
    return this.provider.chat(prompt, options);
  }

  async streamChat(
    prompt: string,
    onToken: (token: string) => void,
    options?: ChatOptions
  ): Promise<void> {
    return this.provider.streamChat(prompt, onToken, options);
  }

  async embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }

  getModel(): string {
    return this.provider.getModel();
  }
}
