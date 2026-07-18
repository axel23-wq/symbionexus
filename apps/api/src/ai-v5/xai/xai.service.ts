import { Injectable, Logger } from '@nestjs/common';

export interface XAiReasoning {
  criteria: {
    materialCompatibility: number;
    distance: number;
    trustScore: number;
    logisticsAvailability: number;
  };
  details: {
    distanceKm: number;
    estimatedLogisticsCostFcfa: number;
    co2SavedKg: number;
    riskLevel: 'Faible' | 'Moyen' | 'Élevé';
  };
  summary: string;
}

@Injectable()
export class XAiService {
  private readonly logger = new Logger(XAiService.name);

  /**
   * Génère une explication claire et détaillée pour un match donné
   */
  generateExplanation(
    materialScore: number,
    distanceScore: number,
    distanceKm: number,
    co2Kg: number,
    trustScore: number,
    isLogisticsAvailable: boolean
  ): XAiReasoning {
    this.logger.log(`[XAI Engine] Generating explanation for Match...`);

    // Poids dynamiques
    const materialWeight = materialScore;
    const distanceWeight = distanceScore;
    const logAvailability = isLogisticsAvailable ? 100 : 0;

    // Calcul du coût logistique (Estimation basique: 500 FCFA/km)
    const estimatedCostFcfa = distanceKm * 500;

    // Risque
    let riskLevel: 'Faible' | 'Moyen' | 'Élevé' = 'Faible';
    if (trustScore < 50 || distanceKm > 300) riskLevel = 'Élevé';
    else if (trustScore < 75 || distanceKm > 100) riskLevel = 'Moyen';

    // Summary (Textual representation for the frontend)
    const summary = `• Compatibilité matière : ${materialScore}%\n` +
      `• Distance : ${distanceKm} km\n` +
      `• Coût logistique estimé : ${estimatedCostFcfa} FCFA\n` +
      `• CO₂ émis/économisé : ${co2Kg} kg\n` +
      `• Confiance Partenaire : ${trustScore}%\n` +
      `• Disponibilité logistique : ${isLogisticsAvailable ? 'Oui' : 'Non'}\n` +
      `• Risque : ${riskLevel}`;

    return {
      criteria: {
        materialCompatibility: materialScore,
        distance: distanceScore,
        trustScore,
        logisticsAvailability: logAvailability,
      },
      details: {
        distanceKm,
        estimatedLogisticsCostFcfa: estimatedCostFcfa,
        co2SavedKg: co2Kg, // Actually it's co2 emitted, but we'll adapt depending on context
        riskLevel
      },
      summary
    };
  }
}
