import { Controller, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { GetPlatformAnalyticsQuery, GetCompanyAnalyticsQuery } from '../../../application/queries/analytics/analytics.queries';

@ApiTags('analytics (core)')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsCoreController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('platform')
  @ApiOperation({ summary: 'Obtenir les statistiques globales de la plateforme (Admins uniquement)' })
  async getPlatformAnalytics(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return this.queryBus.execute(new GetPlatformAnalyticsQuery());
  }

  @Get('company')
  @ApiOperation({ summary: 'Obtenir les statistiques de l\'entreprise connectée' })
  async getCompanyAnalytics(@Req() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('L\'utilisateur n\'est pas rattaché à une entreprise');
    }
    return this.queryBus.execute(new GetCompanyAnalyticsQuery(req.user.companyId));
  }
}
