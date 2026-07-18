import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LogisticsController } from './logistics.controller';
import { GetActiveTransportsHandler } from './queries/get-active-transports.handler';

const QueryHandlers = [GetActiveTransportsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [LogisticsController],
  providers: [...QueryHandlers],
  exports: [],
})
export class LogisticsModule {}
