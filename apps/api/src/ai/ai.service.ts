import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  async processMessage(
    message: string,
    module: string,
    conversationId: string,
    userId: string,
    onToken: (token: string) => void
  ): Promise<string> {
    this.logger.log(`Processing message for module: ${module}`);
    // TODO: Implement in Task 5
    return '';
  }
}
