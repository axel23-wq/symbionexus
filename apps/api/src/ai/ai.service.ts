import { Injectable, Logger } from '@nestjs/common';
import { ProviderService } from './providers/provider.service';
import { ConversationService } from './core/conversation.service';
import { WorkflowContextService } from './workflow-context/workflow-context.service';
import { RetrieverService } from './rag/retriever.service';

@Injectable()
export class AIService {
  private logger = new Logger(AIService.name);

  constructor(
    private provider: ProviderService,
    private conversations: ConversationService,
    private workflowContext: WorkflowContextService,
    private retriever: RetrieverService
  ) {}

  async processMessage(
    message: string,
    module: string,
    conversationId: string,
    userId: string,
    onToken: (token: string) => void
  ): Promise<string> {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    this.logger.log(
      `Processing message for user ${userId}, module: ${module}`
    );

    try {
      // Save user message
      await this.conversations.createMessage(
        conversationId,
        'user',
        message,
        userId
      );

      // Get conversation history
      const history = await this.conversations.getHistory(conversationId);

      // Get RAG context with graceful degradation
      let ragContext = '';
      try {
        const chunks = await this.retriever.retrieve(message, module);
        if (chunks.length > 0) {
          this.logger.debug(`Retrieved ${chunks.length} relevant code chunks`);
          ragContext = chunks
            .map((c) => `[${c.filePath}:${c.startLine}-${c.endLine}]\n${c.content}`)
            .join('\n\n---\n\n');
        }
      } catch (ragError) {
        this.logger.warn('RAG retrieval failed, continuing without context', ragError);
      }

      // Get workflow system prompt
      const systemPrompt = await this.workflowContext.getContext(module);

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
    } catch (error) {
      this.logger.error('Message processing error:', error);
      throw error;
    }
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
}
