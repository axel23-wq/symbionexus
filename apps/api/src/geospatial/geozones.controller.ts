import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeoZonesService } from './services/geozones.service';

@ApiTags('geozones')
@Controller('geozones')
export class GeoZonesController {
  constructor(private readonly geoZonesService: GeoZonesService) {}

  @Get('hierarchy')
  @ApiOperation({ summary: 'Obtenir la hiérarchie des zones géographiques (Pays > Région > Quartier)' })
  @ApiResponse({ status: 200, description: 'La liste des zones.' })
  async getHierarchy(@Query('parentId') parentId?: string) {
    return this.geoZonesService.getHierarchy(parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une zone spécifique et de ses POIs' })
  @ApiResponse({ status: 200, description: 'Les détails de la zone.' })
  async getZoneDetails(@Param('id') id: string) {
    return this.geoZonesService.getZoneDetails(id);
  }
}
