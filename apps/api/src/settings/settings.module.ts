import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ApiKeysService } from './api-keys.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService, ApiKeysService],
})
export class SettingsModule {}
