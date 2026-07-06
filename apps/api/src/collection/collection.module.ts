import { Module, Logger } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionGateway } from './collection.gateway';
import { VISION_PROVIDER } from './vision/vision-provider.interface';
import { ClaudeVisionAdapter } from './vision/claude-vision.adapter';
import { HeuristicVisionAdapter } from './vision/heuristic-vision.adapter';
import { VideoAnalysisService } from './vision/video-analysis.service';

/**
 * Sélection PRODUCTION-GRADE du moteur Vision IA.
 *   - ANTHROPIC_API_KEY présent → Claude Vision FORCÉ (heuristique désactivée).
 *   - Pas de clé + NODE_ENV=production → échec explicite (aucune simulation en prod).
 *   - Pas de clé hors prod → fallback heuristique dev (temporaire, transparent).
 */
const visionProviderFactory = {
  provide: VISION_PROVIDER,
  useFactory: (claude: ClaudeVisionAdapter, heuristic: HeuristicVisionAdapter) => {
    const log = new Logger('Vision');
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const override = (process.env.VISION_PROVIDER || '').toLowerCase();
    if (hasKey && override !== 'heuristic') { log.log('Moteur Vision IA : claude (production)'); return claude; }
    if (process.env.NODE_ENV === 'production') throw new Error('ANTHROPIC_API_KEY requis en production — fallback heuristique interdit');
    log.warn('Moteur Vision IA : heuristic (DEV — aucune clé Anthropic)');
    return heuristic;
  },
  inject: [ClaudeVisionAdapter, HeuristicVisionAdapter],
};

@Module({
  controllers: [CollectionController],
  providers: [CollectionService, CollectionGateway, ClaudeVisionAdapter, HeuristicVisionAdapter, VideoAnalysisService, visionProviderFactory],
})
export class CollectionModule {}
