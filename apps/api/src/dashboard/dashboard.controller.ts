import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Tableau de bord entreprise' })
  async getCompanyDashboard(@Req() req: any) {
    const user = await this.dashboardService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const dashboard = await this.dashboardService.getCompanyDashboard(user!.companyId);
    return { success: true, data: dashboard };
  }

  @Get('admin')
  @ApiOperation({ summary: 'Tableau de bord administrateur (plateforme)' })
  async getAdminDashboard() {
    const dashboard = await this.dashboardService.getAdminDashboard();
    return { success: true, data: dashboard };
  }
}
