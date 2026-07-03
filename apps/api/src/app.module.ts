import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ListingsModule } from './listings/listings.module';
import { MatchesModule } from './matches/matches.module';
import { ContractsModule } from './contracts/contracts.module';
import { PassportsModule } from './passports/passports.module';
import { CarbonModule } from './carbon/carbon.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ListingsModule,
    MatchesModule,
    ContractsModule,
    PassportsModule,
    CarbonModule,
    MessagingModule,
    NotificationsModule,
    DashboardModule,
    AuditModule,
    SettingsModule,
  ],
})
export class AppModule {}
