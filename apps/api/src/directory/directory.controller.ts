import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DirectoryService } from './directory.service';

@ApiTags('directory')
@Controller('directory')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Get()
  @ApiOperation({ summary: 'Search the National Circular Economy Directory' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'materialCategory', required: false, type: String })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'subdivision', required: false, type: String })
  @ApiQuery({ name: 'activities', required: false, type: [String] })
  @ApiQuery({ name: 'minCapacityKg', required: false, type: Number })
  @ApiQuery({ name: 'hasCollectionService', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async search(
    @Query('query') query?: string,
    @Query('materialCategory') materialCategory?: string,
    @Query('region') region?: string,
    @Query('subdivision') subdivision?: string,
    @Query('activities') activities?: string | string[],
    @Query('minCapacityKg') minCapacityKg?: string,
    @Query('hasCollectionService') hasCollectionService?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const act = activities
      ? Array.isArray(activities)
        ? activities
        : [activities]
      : undefined;

    const result = await this.directoryService.searchDirectory({
      query,
      materialCategory,
      region,
      subdivision,
      activities: act,
      minCapacityKg: minCapacityKg ? Number(minCapacityKg) : undefined,
      hasCollectionService: hasCollectionService === 'true',
      page: page ? Number(page) : 1,
      perPage: perPage ? Number(perPage) : 50,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific enterprise in the Directory' })
  async getDetails(@Param('id') id: string) {
    const company = await this.directoryService.getCompanyDetails(id);
    if (!company) {
      return { success: false, message: 'Company not found' };
    }
    return { success: true, data: company };
  }
}
