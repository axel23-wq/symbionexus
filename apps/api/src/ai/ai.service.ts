import { Injectable, Logger } from '@nestjs/common';
import { ProviderService } from './providers/provider.service';
import { ConversationService } from './core/conversation.service';
import { WorkflowContextService } from './workflow-context/workflow-context.service';

@Injectable()
export class AIService {
  private logger = new Logger(AIService.name);

  constructor(
    private provider: ProviderService,
    private conversations: ConversationService,
    private workflowContext: WorkflowContextService
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
