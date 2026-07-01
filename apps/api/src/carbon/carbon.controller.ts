import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CarbonService } from './carbon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('carbon')
@Controller('carbon')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarbonController {
  constructor(private readonly carbonService: CarbonService) {}

  @Post('generate/:passportId')
  @ApiOperation({ summary: 'Générer un crédit carbone après livraison confirmée' })
  async generate(@Param('passportId') passportId: string) {
    const credit = await this.carbonService.generateCreditFromPassport(passportId);
    return {
      success: true,
      data: credit,
      message: `🌱 Crédit carbone généré : ${credit.co2AvoidedTonnes} tonnes de CO₂ évitées !`,
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes crédits carbone' })
  async findMine(@Req() req: any) {
    const user = await this.carbonService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const credits = await this.carbonService.findByCompany(user!.companyId);
    return { success: true, data: credits };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Mes statistiques carbone' })
  async getMyStats(@Req() req: any) {
    const user = await this.carbonService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const stats = await this.carbonService.getCompanyStats(user!.companyId);
    return { success: true, data: stats };
  }

  @Get('platform-stats')
  @ApiOperation({ summary: 'Statistiques carbone de la plateforme (admin)' })
  async getPlatformStats() {
    const stats = await this.carbonService.getPlatformStats();
    return { success: true, data: stats };
  }
}
