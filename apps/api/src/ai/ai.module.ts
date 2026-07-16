import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AICorModule } from './core/core.module';
import { ProvidersModule } from './providers/providers.module';
import { RAGModule } from './rag/rag.module';

@Module({
  imports: [AICorModule, ProvidersModule, RAGModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
