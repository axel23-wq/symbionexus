import { Injectable, Logger } from '@nestjs/common';
import { ProviderService } from './providers/provider.service';
import { ConversationService } from './core/conversation.service';

@Injectable()
export class AIService {
  private logger = new Logger(AIService.name);

  constructor(
    private provider: ProviderService,
    private conversations: ConversationService
  ) {}

  async processMessage(
    message: string,
    module: string,
    conversationId: string,
    userId: string,
    onToken: (token: string) => void
  ): Promise<string> {
    this.logger.log(
      `Processing message for user ${userId}, module: ${module}`
    );

    // Save user message
    await this.conversations.createMessage(
      conversationId,
      'user',
      message,
      userId
    );

    // Get conversation history
    const history = await this.conversations.getHistory(conversationId);

    // TODO: Get RAG context (Task 10)
    const ragContext = '';

    // Get workflow system prompt
    const systemPrompt = this.getDefaultSystemPrompt(module);

    // Build augmented prompt
    const augmentedPrompt = this.buildPrompt(
      systemPrompt,
      ragContext,
      history,
      message
    );

    this.logger.debug(`Augmented prompt built, calling provider...`);

    // Stream from provider
    let fullResponse = '';

    await this.provider.streamChat(augmentedPrompt, (token: string) => {
      fullResponse += token;
      onToken(token);
    });

    // Save assistant response
    await this.conversations.createMessage(
      conversationId,
      'assistant',
      fullResponse,
      userId
    );

    return fullResponse;
  }

  private buildPrompt(
    systemPrompt: string,
    ragContext: string,
    history: any[],
    userMessage: string
  ): string {
    let prompt = systemPrompt;

    if (ragContext) {
      prompt += `\n\nCONTEXTE DU CODEBASE:\n${ragContext}`;
    }

    if (history.length > 0) {
      prompt += '\n\nHISTORIQUE:';
      history.slice(-5).forEach((msg) => {
        prompt += `\n${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`;
      });
    }

    prompt += `\n\nUtilisateur: ${userMessage}\nAssistant:`;

    return prompt;
  }

  private getDefaultSystemPrompt(module: string): string {
    const prompts: Record<string, string> = {
      general: `Tu es SymbioNexus AI, un assistant intelligent pour la plateforme SymbioNexus.
Tu aides les utilisateurs avec:
- Questions sur l'architecture et le code du projet
- Assistance dans les flux de travail (marketplace, matchmaking, carbone, géospatial)
- Insights métier basés sur les données de la plateforme

Réponds en français, de manière professionnelle et utile.`,

      marketplace: `Tu es un assistant spécialisé dans la Marketplace SymbioNexus.
Tu aides les utilisateurs à:
- Créer et gérer des annonces de déchets/matières premières
- Rechercher des matériaux à vendre ou acheter
- Comprendre les prix et les tendances du marché
- Négocier avec des partenaires commerciaux

Utilise les termes techniques français quand c'est approprié (déchet, matière première, annonce).`,

      matchmaking: `Tu es un assistant spécialisé dans l'algorithme de matching SymbioNexus.
Tu expliques:
- Pourquoi deux entreprises ont été matchées
- Comment améliorer les scores de match
- Les critères de compatibilité (matière, distance, confiance, logistique)

L'algorithme considère:
- Compatibilité matière (40%): Match de secteur, catégorie de déchet
- Distance (25%): Proximité, faisabilité logistique
- Score de confiance (15%): Réputation de l'entreprise
- Capacité/Volume (20%): Alignement capacité acheteur/vendeur`,

      carbon: `Tu es un assistant spécialisé dans les crédits carbone SymbioNexus.
Tu aides à:
- Calculer les économies de CO2 des transactions d'économie circulaire
- Expliquer les mécanismes de crédits carbone
- Suivre la réduction de l'empreinte carbone d'une entreprise
- Guider les stratégies de compensation carbone`,
    };

    return prompts[module] || prompts.general;
  }
}
