import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PredictiveAiService {
  private readonly logger = new Logger(PredictiveAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Analyse l'historique de production d'un acteur pour prédire ses futurs volumes.
   * Simule un modèle de prévision de séries temporelles.
   */
  async forecastFutureSupply(companyId: string, materialCategory: string): Promise<any> {
    this.logger.log(`[Predictive Engine] Forecasting supply for ${companyId} - ${materialCategory}`);
    
    // 1. Récupérer l'historique (les 6 derniers mois par exemple)
    const history = await this.prisma.wasteListing.findMany({
      where: {
        companyId,
        materialCategory: materialCategory as any,
        status: { in: ['MATCHED', 'CLOSED_SUCCESS', 'PUBLISHED'] as any }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (history.length === 0) {
      this.logger.warn(`Pas assez de données pour prédire les volumes de ${companyId}`);
      return null;
    }

    // Calcul de moyenne mobile simplifiée
    const totalVolume = history.reduce((sum: number, listing: any) => sum + listing.volumeKg, 0);
    const averageVolumePerListing = totalVolume / history.length;
    
    // Prédiction à J+7 et J+14
    const today = new Date();
    const predictionJ7 = new Date(today);
    predictionJ7.setDate(today.getDate() + 7);

    const predictionJ14 = new Date(today);
    predictionJ14.setDate(today.getDate() + 14);

    const prediction1 = await this.prisma.aiPrediction.create({
      data: {
        materialCategory,
        predictedVolumeKg: Math.round(averageVolumePerListing * 1.05), // +5% trend
        predictionDate: predictionJ7,
        confidenceScore: 0.85,
        companyId
      }
    });

    const prediction2 = await this.prisma.aiPrediction.create({
      data: {
        materialCategory,
        predictedVolumeKg: Math.round(averageVolumePerListing * 1.10), // +10% trend
        predictionDate: predictionJ14,
        confidenceScore: 0.72,
        companyId
      }
    });

    this.logger.log(`🔮 Predictions created for ${materialCategory}: J+7(${prediction1.predictedVolumeKg}kg), J+14(${prediction2.predictedVolumeKg}kg)`);

    this.eventEmitter.emit('ai.futureSupplyDetected', { companyId, predictions: [prediction1, prediction2] });

    return [prediction1, prediction2];
  }
}
