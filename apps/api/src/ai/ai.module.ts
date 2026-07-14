import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AICorModule } from './core/core.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [AICorModule, ProvidersModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
