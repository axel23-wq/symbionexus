import { Module, Logger } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionGateway } from './collection.gateway';
import { VISION_PROVIDER } from './vision/vision-provider.interface';
import { ClaudeVisionAdapter } from './vision/claude-vision.adapter';
import { HeuristicVisionAdapter } from './vision/heuristic-vision.adapter';

/**
 * Sélection du moteur Vision IA à l'exécution via VISION_PROVIDER (ou auto).
 *   claude  → ClaudeVisionAdapter (réel, requiert ANTHROPIC_API_KEY)
 *   sinon   → HeuristicVisionAdapter (fallback dev temporaire)
 * Si ANTHROPIC_API_KEY est présent, Claude est choisi automatiquement.
 */
const visionProviderFactory = {
  provide: VISION_PROVIDER,
  useFactory: (claude: ClaudeVisionAdapter, heuristic: HeuristicVisionAdapter) => {
    const sel = (process.env.VISION_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'claude' : 'heuristic')).toLowerCase();
    const chosen = sel === 'claude' ? claude : heuristic;
    new Logger('Vision').log(`Moteur Vision IA actif : ${chosen.name}`);
    return chosen;
  },
  inject: [ClaudeVisionAdapter, HeuristicVisionAdapter],
};

@Module({
  controllers: [CollectionController],
  providers: [CollectionService, CollectionGateway, ClaudeVisionAdapter, HeuristicVisionAdapter, visionProviderFactory],
})
export class CollectionModule {}
