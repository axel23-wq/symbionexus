import { Module } from '@nestjs/common';
import { AutoLearningService } from './auto-learning.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AutoLearningService],
  exports: [AutoLearningService],
})
export class AutoLearningModule {}
