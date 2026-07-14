import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { AuditModule } from './audit/audit.module';
import { CollectionModule } from './collection/collection.module';
import { PaymentsModule } from './payments/payments.module';
import { CoreModule } from './core/core.module';
import { LogisticsModule } from './logistics/logistics.module';
import { GeospatialModule } from './geospatial/geospatial.module';
import { DirectoryModule } from './directory/directory.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting global : 10000 req / 60s / IP (augmenté pour le développement)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10000 }]),
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
    AuditModule,
    CollectionModule,
    PaymentsModule,
    LogisticsModule,
    GeospatialModule,
    DirectoryModule,
    AIModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
