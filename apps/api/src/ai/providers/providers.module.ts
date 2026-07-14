import { Module } from '@nestjs/common';
import { ProviderFactory } from './provider.factory';
import { ProviderService } from './provider.service';

@Module({
  providers: [ProviderFactory, ProviderService],
  exports: [ProviderService],
})
export class ProvidersModule {}
