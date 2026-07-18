import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AutoLearningService {
  private readonly logger = new Logger(AutoLearningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Écoute les événements de finalisation de contrat pour améliorer les partenaires.
   * "Le système doit apprendre automatiquement."
   */
  @OnEvent('contract.completed')
  async handleContractCompleted(payload: { matchId: string; success: boolean }) {
    this.logger.log(`[Auto Learning Engine] Processing completed contract for match ${payload.matchId}. Success: ${payload.success}`);

    const match = await this.prisma.match.findUnique({
      where: { id: payload.matchId },
      include: { buyerCompany: true, sellerCompany: true }
    });

    if (!match) return;

    const adjustment = payload.success ? 0.05 : -0.15; // Pénalité plus forte en cas d'échec

    // Mettre à jour le buyer
    if (match.buyerCompany.trustScore !== null) {
      await this.prisma.company.update({
        where: { id: match.buyerCompany.id },
        data: {
          trustScore: Math.min(1.0, Math.max(0.0, match.buyerCompany.trustScore + adjustment))
        }
      });
    }

    // Mettre à jour le seller
    if (match.sellerCompany.trustScore !== null) {
      await this.prisma.company.update({
        where: { id: match.sellerCompany.id },
        data: {
          trustScore: Math.min(1.0, Math.max(0.0, match.sellerCompany.trustScore + adjustment))
        }
      });
    }

    // Sauvegarder la trace de l'apprentissage
    await this.prisma.aiLearningLog.create({
      data: {
        matchId: payload.matchId,
        result: payload.success ? 'SUCCESS' : 'FAILURE',
        scoreAdjustments: { trustScore: adjustment }
      }
    });

    this.logger.log(`🧠 AI Models improved. Trust scores adjusted by ${adjustment}`);
  }
}
