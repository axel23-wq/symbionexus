import { Controller, Get, Post, Body, Query, ParseFloatPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { FindNearestQuery } from './queries/find-nearest.query';
import { FindInRadiusQuery } from './queries/find-in-radius.query';
import { CalculateRouteQuery } from './queries/calculate-route.query';
import { FindInBboxQuery } from './queries/find-in-bbox.query';
import { SearchGeoLocationDto } from './dto/search-geo.dto';
import { ImportGeoLocationDto } from './dto/import-geo.dto';
import { OfficialDataImporterService } from './services/official-data-importer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('geospatial')
@Controller('geospatial')
export class GeospatialController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly importerService: OfficialDataImporterService
  ) {}

  @Get('bbox')
  @ApiOperation({ summary: 'Trouver toutes les entités dans une Bounding Box (pour le viewport de la carte)' })
  @ApiResponse({ status: 200, description: 'Liste des entités dans la Bounding Box.' })
  @ApiQuery({ name: 'categories', required: false, type: String, description: 'Catégories séparées par des virgules (ex: HOSPITAL,PORT)' })
  async getInBbox(
    @Query('minLng', ParseFloatPipe) minLng: number,
    @Query('minLat', ParseFloatPipe) minLat: number,
    @Query('maxLng', ParseFloatPipe) maxLng: number,
    @Query('maxLat', ParseFloatPipe) maxLat: number,
    @Query('categories') categoriesStr?: string,
  ) {
    const categories = categoriesStr ? categoriesStr.split(',') : [];
    return this.queryBus.execute(new FindInBboxQuery(minLng, minLat, maxLng, maxLat, categories));
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Trouver l\'entité la plus proche (KNN PostGIS)' })
  @ApiResponse({ status: 200, description: 'L\'entité la plus proche trouvée.' })
  async getNearest(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('category') category: string,
  ) {
    return this.queryBus.execute(new FindNearestQuery(lat, lng, category));
  }

  @Get('radius')
  @ApiOperation({ summary: 'Trouver toutes les entités dans un rayon donné' })
  @ApiResponse({ status: 200, description: 'Liste des entités.' })
  async getInRadius(@Query() query: SearchGeoLocationDto) {
    const lat = query.lat || 4.0511;
    const lng = query.lng || 9.7679;
    const radiusKm = query.radiusKm || 10;
    return this.queryBus.execute(new FindInRadiusQuery(lat, lng, radiusKm, query.category));
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Importer une donnée officielle (Administrateur/Système)' })
  @ApiResponse({ status: 201, description: 'La donnée a été importée avec succès.' })
  async importOfficialData(@Body() dto: ImportGeoLocationDto) {
    return this.importerService.importOfficialData(dto);
  }

  @Get('routing')
  @ApiOperation({ summary: 'Calculer un itinéraire et son empreinte carbone' })
  @ApiResponse({ status: 200, description: 'Détails du trajet et émissions CO2' })
  async calculateRoute(
    @Query('originLat', ParseFloatPipe) originLat: number,
    @Query('originLng', ParseFloatPipe) originLng: number,
    @Query('destLat', ParseFloatPipe) destLat: number,
    @Query('destLng', ParseFloatPipe) destLng: number,
    @Query('vehicleType') vehicleType?: 'truck' | 'van' | 'car',
  ) {
    return this.queryBus.execute(
      new CalculateRouteQuery(originLat, originLng, destLat, destLng, vehicleType || 'truck')
    );
  }
}
