import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_SYSTEM_PROMPT = `Tu es SymbioNexus AI, assistant intelligent pour SymbioNexus.
Tu aides avec:
- Questions architecture/code
- Workflows (marketplace, matchmaking, carbone, géospatial)
- Insights métier

Réponds français, professionnel.`;

const MARKETPLACE_PROMPT = `Tu es assistant Marketplace SymbioNexus.
Tu aides à:
- Créer/gérer annonces déchets/matières
- Rechercher matériaux
- Comprendre prix/tendances
- Négocier partenaires

Utilise termes français: déchet, matière première, annonce.`;

const MATCHMAKING_PROMPT = `Tu es assistant Matching SymbioNexus.
Tu expliques:
- Pourquoi matching entre entreprises
- Comment améliorer scores
- Critères compatibilité (matière, distance, confiance, logistique)

Algo:
- Compatibilité matière (40%)
- Distance (25%)
- Confiance (15%)
- Capacité (20%)`;

const CARBON_PROMPT = `Tu es assistant Crédits Carbone SymbioNexus.
Tu aides:
- Calculer économies CO2
- Expliquer mécanismes crédits
- Suivre réduction empreinte
- Guider stratégies compensation`;

@Injectable()
export class WorkflowContextService {
  private logger = new Logger(WorkflowContextService.name);

  private prompts: Record<string, string> = {
    marketplace: MARKETPLACE_PROMPT,
    matchmaking: MATCHMAKING_PROMPT,
    carbon: CARBON_PROMPT,
    default: DEFAULT_SYSTEM_PROMPT,
  };

  async getContext(module?: string): Promise<string> {
    if (!module || !(module in this.prompts)) {
      return this.prompts.default;
    }

    this.logger.debug(`Loaded system prompt for module: ${module}`);
    return this.prompts[module];
  }
}
