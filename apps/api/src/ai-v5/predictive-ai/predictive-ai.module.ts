import { Module } from '@nestjs/common';
import { PredictiveAiService } from './predictive-ai.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PredictiveAiService],
  exports: [PredictiveAiService],
})
export class PredictiveAiModule {}
