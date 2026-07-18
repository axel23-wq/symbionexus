import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetActiveTransportsQuery } from './queries/get-active-transports.query';

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('active-transports')
  async getActiveTransports() {
    return this.queryBus.execute(new GetActiveTransportsQuery());
  }
}
