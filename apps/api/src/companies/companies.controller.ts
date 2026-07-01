import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les entreprises' })
  async findAll(
    @Query('companySector') companySector?: string,
    @Query('kybStatus') kybStatus?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    const result = await this.companiesService.findAll({ companySector, kybStatus, page, perPage });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une entreprise' })
  async findOne(@Param('id') id: string) {
    const company = await this.companiesService.findById(id);
    return { success: true, data: company };
  }
}
