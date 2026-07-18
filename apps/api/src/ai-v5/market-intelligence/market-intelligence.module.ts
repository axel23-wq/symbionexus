import { Module } from '@nestjs/common';
import { MarketIntelligenceService } from './market-intelligence.service';
import { MarketIntelligenceController } from './market-intelligence.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MarketIntelligenceController],
  providers: [MarketIntelligenceService, PrismaService],
  exports: [MarketIntelligenceService],
})
export class MarketIntelligenceModule {}
