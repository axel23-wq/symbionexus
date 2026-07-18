import { Module } from '@nestjs/common';
import { PredictiveAiModule } from './predictive-ai/predictive-ai.module';
import { SupplyChainModule } from './supply-chain/supply-chain.module';
import { DynamicPricingModule } from './dynamic-pricing/dynamic-pricing.module';
import { AutoLearningModule } from './auto-learning/auto-learning.module';
import { XAiModule } from './xai/xai.module';
import { MarketIntelligenceModule } from './market-intelligence/market-intelligence.module';

@Module({
  imports: [
    PredictiveAiModule,
    SupplyChainModule,
    DynamicPricingModule,
    AutoLearningModule,
    XAiModule,
    MarketIntelligenceModule,
  ],
  exports: [
    PredictiveAiModule,
    SupplyChainModule,
    DynamicPricingModule,
    AutoLearningModule,
    XAiModule,
    MarketIntelligenceModule,
  ],
})
export class AiV5Module {}
