import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, ChatOptions } from './provider.interface';

@Injectable()
export class GroqProvider implements AIProvider {
  private model = 'llama-3.2-1b-preview'; // Stable free model
  private logger = new Logger(GroqProvider.name);
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }
  }

  async chat(prompt: string, options?: ChatOptions): Promise<string> {
    try {
      const response = await this.makeRequest({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1.0,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Groq chat error:', error);
      throw error;
    }
  }

  async streamChat(
    prompt: string,
    onToken: (token: string) => void,
    options?: ChatOptions
  ): Promise<void> {
    try {
      await this.makeStreamRequest(
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 2048,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP ?? 1.0,
          stream: true,
        },
        onToken
      );
    } catch (error) {
      this.logger.error('Groq stream error:', error);
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    // Groq doesn't have embeddings API yet, return placeholder
    this.logger.warn('Groq embeddings not available, returning placeholder');
    return Array(1536).fill(0);
  }

  getModel(): string {
    return this.model;
  }

  private async makeRequest(body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  private async makeStreamRequest(
    body: any,
    onToken: (token: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          this.processStreamLine(line, onToken);
        }

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];
      }

      // Process any remaining data
      if (buffer) {
        this.processStreamLine(buffer, onToken);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private processStreamLine(line: string, onToken: (token: string) => void): void {
    if (!line.trim()) {
      return;
    }

    if (line.startsWith('data: ')) {
      const data = line.substring(6);

      if (data === '[DONE]') {
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content || '';
        if (token) {
          onToken(token);
        }
      } catch (e) {
        this.logger.debug('Failed to parse stream data:', e);
      }
    }
  }
}
