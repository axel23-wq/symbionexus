import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GeospatialModule } from '../geospatial/geospatial.module';
import { CarbonModule } from '../carbon/carbon.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersController } from './presentation/http/users/users.controller';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PrismaRoleRepository } from './infrastructure/database/prisma-role.repository';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.interface';
import { PrismaAuditLogRepository } from './infrastructure/database/prisma-audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { AuditEventSubscriber } from './infrastructure/messaging/audit-event.subscriber';
import { FilesController } from './presentation/controllers/files.controller';
import { PrismaFileRepository } from './infrastructure/database/prisma-file.repository';
import { LocalFileStorageService } from './infrastructure/storage/local-file-storage.service';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';

import { GetCompanyDashboardHandler } from './application/queries/dashboard/get-company-dashboard.handler';
import { GetAdminDashboardHandler } from './application/queries/dashboard/get-admin-dashboard.handler';
import { DashboardCoreController } from './presentation/http/dashboard/dashboard.controller';

import { GetProfileHandler } from './application/queries/settings/get-profile.handler';
import {
  UpdateCompanyHandler,
  UpdatePreferencesHandler,
  UpdateNotificationsHandler,
  AddCertificationHandler,
  DeleteCertificationHandler,
} from './application/commands/settings/settings.handlers';
import { SettingsCoreController } from './presentation/http/settings/settings.controller';

import { GetNotificationsHandler, GetUnreadCountHandler } from './application/queries/notifications/notifications.handlers';
import {
  CreateNotificationHandler,
  MarkNotificationReadHandler,
  MarkAllNotificationsReadHandler,
} from './application/commands/notifications/notifications.handlers';
import { NotificationsCoreController } from './presentation/http/notifications/notifications.controller';
import { NotificationsGateway } from './presentation/ws/notifications.gateway';

import { GetPlatformAnalyticsHandler, GetCompanyAnalyticsHandler } from './application/queries/analytics/analytics.handlers';
import { AnalyticsCoreController } from './presentation/http/analytics/analytics.controller';

import { ComputeAiMatchHandler } from './application/commands/ai-match/ai-match.handlers';
import { AiController } from './presentation/http/ai/ai.controller';

import {
  GetShortagesHandler,
  GetPredictionsHandler,
  GetFraudDetectionHandler,
  GetCapacityBalancingHandler,
  GetTrustScoresHandler,
  GetMarketIntelligenceHandler,
} from './application/queries/market-intelligence/market-intelligence.handlers';
import { MarketIntelligenceController } from './presentation/http/market-intelligence/market-intelligence.controller';

const CommandHandlers = [
  CreateUserHandler,
  UpdateCompanyHandler,
  UpdatePreferencesHandler,
  UpdateNotificationsHandler,
  AddCertificationHandler,
  DeleteCertificationHandler,
  CreateNotificationHandler,
  MarkNotificationReadHandler,
  MarkAllNotificationsReadHandler,
  ComputeAiMatchHandler,
];
const QueryHandlers = [
  GetCompanyDashboardHandler,
  GetAdminDashboardHandler,
  GetProfileHandler,
  GetNotificationsHandler,
  GetUnreadCountHandler,
  GetPlatformAnalyticsHandler,
  GetCompanyAnalyticsHandler,
  GetShortagesHandler,
  GetPredictionsHandler,
  GetFraudDetectionHandler,
  GetCapacityBalancingHandler,
  GetTrustScoresHandler,
  GetMarketIntelligenceHandler,
];

import { JwtModule } from '@nestjs/jwt';
import { AiV5Module } from '../ai-v5/ai-v5.module';

@Global()
@Module({
  imports: [
    CqrsModule,
    GeospatialModule,
    CarbonModule,
    AiV5Module,
    JwtModule.register({}),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  controllers: [
    UsersController,
    FilesController,
    DashboardCoreController,
    SettingsCoreController,
    NotificationsCoreController,
    AnalyticsCoreController,
    AiController,
    MarketIntelligenceController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: 'IFileRepository', useClass: PrismaFileRepository },
    { provide: 'IFileStorageService', useClass: LocalFileStorageService },
    UploadFileUseCase,
    AuditEventSubscriber,
    NotificationsGateway,
  ],
  exports: [CqrsModule, EventEmitterModule, USER_REPOSITORY, ROLE_REPOSITORY, AUDIT_LOG_REPOSITORY, 'IFileRepository', 'IFileStorageService', UploadFileUseCase],
})
export class CoreModule {}
