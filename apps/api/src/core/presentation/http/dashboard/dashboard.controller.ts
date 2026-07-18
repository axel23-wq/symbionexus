import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/guards/roles.guard';
import { GetCompanyDashboardQuery } from '../../../application/queries/dashboard/get-company-dashboard.query';
import { GetAdminDashboardQuery } from '../../../application/queries/dashboard/get-admin-dashboard.query';

@ApiTags('dashboard (core)')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardCoreController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Roles('SELLER', 'BUYER')
  @ApiOperation({ summary: 'Obtenir le tableau de bord de l\'entreprise' })
  async getDashboard(@Req() req: any) {
    return this.queryBus.execute(new GetCompanyDashboardQuery(req.user.companyId));
  }

  @Get('admin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtenir le tableau de bord administrateur (Plateforme)' })
  async getAdminDashboard() {
    return this.queryBus.execute(new GetAdminDashboardQuery());
  }
}
