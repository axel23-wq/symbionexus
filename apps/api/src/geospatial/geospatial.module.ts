import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GeospatialController } from './geospatial.controller';
import { GeoZonesController } from './geozones.controller';
import { FindNearestHandler } from './queries/find-nearest.handler';
import { FindInRadiusHandler } from './queries/find-in-radius.handler';
import { CalculateRouteHandler } from './queries/calculate-route.handler';
import { FindInBboxHandler } from './queries/find-in-bbox.handler';
import { PostGisRepository } from './repositories/postgis.repository';
import { OfficialDataImporterService } from './services/official-data-importer.service';
import { GeoZonesService } from './services/geozones.service';
import { GeospatialGateway } from './gateways/geospatial.gateway';

const QueryHandlers = [FindNearestHandler, FindInRadiusHandler, CalculateRouteHandler, FindInBboxHandler];

@Module({
  imports: [CqrsModule],
  controllers: [GeospatialController, GeoZonesController],
  providers: [
    PostGisRepository,
    OfficialDataImporterService,
    GeoZonesService,
    GeospatialGateway,
    ...QueryHandlers
  ],
  exports: [PostGisRepository, GeospatialGateway, GeoZonesService],
})
export class GeospatialModule {}

