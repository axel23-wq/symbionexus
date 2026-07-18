import { Module } from '@nestjs/common';
import { SupplyChainAiService } from './supply-chain.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeospatialModule } from '../../geospatial/geospatial.module';

@Module({
  imports: [PrismaModule, GeospatialModule],
  providers: [SupplyChainAiService],
  exports: [SupplyChainAiService],
})
export class SupplyChainModule {}
