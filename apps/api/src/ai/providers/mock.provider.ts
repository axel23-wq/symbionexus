import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, ChatOptions } from './provider.interface';

@Injectable()
export class MockProvider implements AIProvider {
  private logger = new Logger(MockProvider.name);

  constructor() {
    this.logger.log('⚠️ Using Mock AI Provider (demo mode - no real API calls)');
  }

  async chat(prompt: string, options?: ChatOptions): Promise<string> {
    this.logger.debug('Mock chat called with prompt:', prompt.substring(0, 50));
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.generateMockResponse(prompt);
  }

  async streamChat(
    prompt: string,
    onToken: (token: string) => void,
    options?: ChatOptions
  ): Promise<void> {
    this.logger.debug('Mock streamChat called');

    const response = this.generateMockResponse(prompt);
    const words = response.split(' ');

    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
      onToken(word + ' ');
    }
  }

  async embed(text: string): Promise<number[]> {
    // Mock embedding: return random vector of size 1536 (OpenAI embedding size)
    const size = 1536;
    return Array.from({ length: size }, () => Math.random() * 2 - 1);
  }

  getModel(): string {
    return 'mock-model-demo';
  }

  private generateMockResponse(prompt: string): string {
    const responses: { [key: string]: string } = {
      'bonjour': 'Bonjour! Je suis l\'assistant IA SymbioNexus en mode démo. Posez-moi une question sur l\'économie circulaire ou la plateforme.',
      'hello': 'Hello! I\'m the SymbioNexus AI assistant in demo mode. Ask me anything about circular economy or the platform.',
      'marketplace': 'Le marketplace SymbioNexus connecte les entreprises qui produisent des déchets avec celles qui peuvent les réutiliser comme matières premières.',
      'carbon': 'Les crédits carbone sont générés automatiquement quand les matériaux sont appareillés et transportés. Plus la distance est courte, plus les crédits sont importants.',
      'matching': 'L\'algorithme d\'appareillage IA utilise 4 critères: compatibilité matérielle (40%), distance (25%), volume (20%), et score de confiance (15%).',
      'default': 'C\'est une excellente question! En mode démo, je simule une réponse IA. Pour les vraies réponses, veuillez configurer une clé API Anthropic ou Groq.'
    };

    const lowerPrompt = prompt.toLowerCase();

    for (const [key, value] of Object.entries(responses)) {
      if (lowerPrompt.includes(key)) {
        return value;
      }
    }

    return responses.default;
  }
}
