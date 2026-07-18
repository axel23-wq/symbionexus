import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketIntelligenceService } from './market-intelligence.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Market Intelligence')
@Controller('market-intelligence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarketIntelligenceController {
  constructor(private readonly miService: MarketIntelligenceService) {}

  @Get('shortages')
  @ApiOperation({ summary: 'Obtenir les alertes de pénurie' })
  async getShortages() {
    return this.miService.getShortages();
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Obtenir les prévisions globales' })
  async getPredictions() {
    return this.miService.getPredictions();
  }

  @Get('fraud')
  @ApiOperation({ summary: 'Détection d\'anomalies et fraude' })
  async getFraudDetection() {
    return this.miService.getFraudDetection();
  }

  @Get('capacity')
  @ApiOperation({ summary: 'Équilibrage des capacités logistiques' })
  async getCapacityBalancing() {
    return this.miService.getCapacityBalancing();
  }

  @Get('trust-scores')
  @ApiOperation({ summary: 'Classement des Trust Scores' })
  async getTrustScores() {
    return this.miService.getTrustScores();
  }

  @Get('global')
  @ApiOperation({ summary: 'Vue d\'ensemble de l\'OS' })
  async getGlobalAnalytics() {
    return this.miService.getGlobalAnalytics();
  }
}
