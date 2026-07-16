import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IndexerService } from './indexer.service';
import { RetrieverService } from './retriever.service';

@Module({
  imports: [PrismaModule],
  providers: [IndexerService, RetrieverService],
  exports: [IndexerService, RetrieverService],
})
export class RAGModule {}
