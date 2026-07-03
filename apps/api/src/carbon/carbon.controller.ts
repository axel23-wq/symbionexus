import { Controller, Get, Post, Patch, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('market')
  @ApiOperation({ summary: 'Marché secondaire : crédits en vente' })
  async market() {
    const data = await this.carbonService.getMarket();
    return { success: true, data };
  }

  @Patch(':id/list')
  @ApiOperation({ summary: 'Mettre un crédit en vente' })
  async list(@Req() req: any, @Param('id') id: string, @Body() body: { pricePerTonne?: number }) {
    const data = await this.carbonService.listForSale(req.user.sub, id, body?.pricePerTonne);
    return { success: true, data, message: 'Crédit mis en vente' };
  }

  @Patch(':id/unlist')
  @ApiOperation({ summary: 'Retirer un crédit de la vente' })
  async unlist(@Req() req: any, @Param('id') id: string) {
    const data = await this.carbonService.unlist(req.user.sub, id);
    return { success: true, data, message: 'Crédit retiré de la vente' };
  }

  @Patch(':id/retire')
  @ApiOperation({ summary: 'Compenser (retirer définitivement) un crédit' })
  async retire(@Req() req: any, @Param('id') id: string) {
    const data = await this.carbonService.retire(req.user.sub, id);
    return { success: true, data, message: 'Crédit compensé (retiré)' };
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Télécharger le certificat PDF' })
  async certificate(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.carbonService.getCertificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }
}
