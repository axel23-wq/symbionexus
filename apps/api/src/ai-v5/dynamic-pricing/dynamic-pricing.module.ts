import { Module } from '@nestjs/common';
import { DynamicPricingService } from './dynamic-pricing.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DynamicPricingService],
  exports: [DynamicPricingService],
})
export class DynamicPricingModule {}
