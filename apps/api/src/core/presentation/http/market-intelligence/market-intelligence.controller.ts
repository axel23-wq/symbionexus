import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import {
  GetShortagesQuery,
  GetPredictionsQuery,
  GetFraudDetectionQuery,
  GetCapacityBalancingQuery,
  GetTrustScoresQuery,
  GetMarketIntelligenceQuery,
} from '../../../application/queries/market-intelligence/market-intelligence.queries';

@ApiTags('market-intelligence (core)')
@Controller('market-intelligence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarketIntelligenceController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('shortages')
  @ApiOperation({ summary: '1. MATCHMAKING TEMPS RÉEL MENACES & PÉNURIES' })
  async getShortages() {
    return this.queryBus.execute(new GetShortagesQuery());
  }

  @Get('predictions')
  @ApiOperation({ summary: '2. PRÉVISION PRÉDICTIVE OFFRE-DEMANDE' })
  async getPredictions() {
    return this.queryBus.execute(new GetPredictionsQuery());
  }

  @Get('fraud')
  @ApiOperation({ summary: '3. DÉTECTION ANOMALIES & ANTI-FRAUDE' })
  async getFraudDetection() {
    return this.queryBus.execute(new GetFraudDetectionQuery());
  }

  @Get('capacity')
  @ApiOperation({ summary: '4. ÉQUILIBRAGE DYNAMIQUE DES CAPACITÉS' })
  async getCapacityBalancing() {
    return this.queryBus.execute(new GetCapacityBalancingQuery());
  }

  @Get('trust-scores')
  @ApiOperation({ summary: '5. SCORE DE CONFIANCE FOURNISSEUR' })
  async getTrustScores() {
    return this.queryBus.execute(new GetTrustScoresQuery());
  }

  @Get('global')
  @ApiOperation({ summary: 'Market Intelligence Engine (Synthèse Globale)' })
  async getGlobalIntelligence() {
    return this.queryBus.execute(new GetMarketIntelligenceQuery());
  }
}
