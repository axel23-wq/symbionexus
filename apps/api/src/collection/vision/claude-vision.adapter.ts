import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { VisionProvider, VisionAnalysis, WASTE_CATEGORIES, WasteCategory } from './vision-provider.interface';

/**
 * ADAPTATEUR RÉEL — Vision IA via modèle multimodal Claude (Anthropic).
 * Détection multi-objets + matière + qualité + recyclabilité + contamination,
 * en sortie JSON structurée. Aucune heuristique.
 *
 * DÉPENDANCES EXTERNES (à fournir pour activer) :
 *   - ANTHROPIC_API_KEY  : clé API Anthropic
 *   - ANTHROPIC_MODEL    : défaut "claude-sonnet-5" (multimodal)
 * Sélection via VISION_PROVIDER=claude.
 */
@Injectable()
export class ClaudeVisionAdapter implements VisionProvider {
  readonly name = 'claude';
  private readonly logger = new Logger('ClaudeVision');
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;
  private readonly model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  private readonly prompt =
    `Tu es un expert en tri de déchets pour une plateforme d'économie circulaire au Cameroun. ` +
    `Analyse l'image et réponds UNIQUEMENT par un objet JSON valide (aucun texte autour), schéma:\n` +
    `{"category": one of ${JSON.stringify(WASTE_CATEGORIES)}, "material": string (matière fine ex PET/aluminium/carton), ` +
    `"objects": [{"label": string, "confidence": number 0..1}], "quality": number 0..1, ` +
    `"recyclability": number 0..1, "contamination": [string], "estimatedWeightKg": number, "confidence": number 0..1}. ` +
    `Détecte TOUS les objets présents. "category" = matière dominante recyclable.`;

  async analyze(imageBase64: string): Promise<VisionAnalysis> {
    if (!this.apiKey) throw new ServiceUnavailableException('ANTHROPIC_API_KEY manquant');
    const m = /^data:(image\/[a-zA-Z+]+);base64,/.exec(imageBase64 || '');
    const mediaType = m?.[1] || 'image/jpeg';
    const data = (imageBase64 || '').split(',').pop() || '';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: this.prompt },
          ],
        }],
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Anthropic échec ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
      throw new ServiceUnavailableException(body?.error?.message || 'Vision API failed');
    }
    const text: string = body?.content?.[0]?.text || '';
    return this.parse(text);
  }

  private parse(text: string): VisionAnalysis {
    const json = text.replace(/```json|```/g, '').trim();
    let d: any;
    try { d = JSON.parse(json.slice(json.indexOf('{'), json.lastIndexOf('}') + 1)); }
    catch { throw new ServiceUnavailableException('Réponse Vision non parsable'); }

    const cat = String(d.category || '').toUpperCase();
    const category: WasteCategory = (WASTE_CATEGORIES as readonly string[]).includes(cat) ? (cat as WasteCategory) : 'PLASTICS';
    const clamp = (n: any, def = 0) => Math.max(0, Math.min(1, Number.isFinite(+n) ? +n : def));
    return {
      category,
      material: String(d.material || 'inconnu'),
      objects: Array.isArray(d.objects) ? d.objects.slice(0, 12).map((o: any) => ({ label: String(o.label || '?'), confidence: clamp(o.confidence, 0.5) })) : [],
      quality: clamp(d.quality, 0.5),
      recyclability: clamp(d.recyclability, 0.5),
      contamination: Array.isArray(d.contamination) ? d.contamination.map((c: any) => String(c)).slice(0, 8) : [],
      estimatedWeightKg: Math.max(0.1, Math.min(1000, Number(d.estimatedWeightKg) || 1)),
      confidence: clamp(d.confidence, 0.6),
      provider: this.name,
    };
  }
}
