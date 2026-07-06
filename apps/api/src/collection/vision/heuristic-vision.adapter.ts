import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Jimp } from 'jimp';
import { VisionProvider, VisionAnalysis, WasteCategory } from './vision-provider.interface';

// Recyclabilité indicative par catégorie (fallback dev uniquement).
const RECYCLABILITY: Record<string, number> = {
  METALS: 0.95, GLASS: 0.9, BIOMASS: 0.8, PLASTICS: 0.7, WOOD: 0.6, TEXTILE: 0.5, OILS: 0.4, CHEMICAL: 0.3,
};

/**
 * ⚠️ ADAPTATEUR HEURISTIQUE — FALLBACK DEV TEMPORAIRE (analyse pixels jimp).
 * PAS un vrai modèle IA. Utilisé uniquement quand VISION_PROVIDER != claude
 * (clé Anthropic absente). Remplacé par ClaudeVisionAdapter sans modif métier.
 */
@Injectable()
export class HeuristicVisionAdapter implements VisionProvider {
  readonly name = 'heuristic';
  private readonly logger = new Logger('HeuristicVision');

  async analyze(imageBase64: string): Promise<VisionAnalysis> {
    const raw = (imageBase64 || '').split(',').pop() || '';
    if (raw.length < 32) throw new BadRequestException('Image invalide ou vide');
    let img: Awaited<ReturnType<typeof Jimp.read>>;
    try { img = await Jimp.read(Buffer.from(raw, 'base64')); }
    catch { throw new BadRequestException('Décodage image échoué'); }

    const width = img.bitmap.width, height = img.bitmap.height;
    img.resize({ w: 48, h: Math.max(1, Math.round((48 * height) / width)) });
    const { data, width: w, height: h } = img.bitmap;

    let sumR = 0, sumG = 0, sumB = 0, sumLum = 0, sumSat = 0;
    const lums: number[] = [];
    const n = w * h;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      sumR += r; sumG += g; sumB += b;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLum += lum; sumSat += max === 0 ? 0 : (max - min) / max; lums.push(lum);
    }
    const avgR = sumR / n, avgG = sumG / n, avgB = sumB / n, brightness = sumLum / n, saturation = sumSat / n;
    let varLum = 0; for (const l of lums) varLum += (l - brightness) ** 2;
    const sharpness = Math.min(1, Math.sqrt(varLum / n) / 64);

    const { category, confidence } = this.classify(avgR, avgG, avgB, brightness, saturation);
    const exposure = 1 - Math.abs(brightness - 128) / 128;
    const quality = Math.max(0.15, Math.min(1, 0.6 * sharpness + 0.4 * exposure));
    const sizeFactor = Math.min(1, (width * height) / (1600 * 1200));
    const estimatedWeightKg = Math.round((1 + sizeFactor * 14) * 10) / 10;

    this.logger.warn(`[FALLBACK dev] ${category} — activer ANTHROPIC_API_KEY pour Vision IA réelle`);
    return {
      category, material: category.toLowerCase(),
      objects: [{ label: category, confidence }],
      quality, recyclability: RECYCLABILITY[category] ?? 0.5,
      contamination: [], estimatedWeightKg, confidence, provider: this.name,
      notes: 'fallback heuristique (dev) — Vision IA réelle inactive',
    };
  }

  private classify(r: number, g: number, b: number, brightness: number, sat: number): { category: WasteCategory; confidence: number } {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const colorfulness = (max - min) / 255;
    if (sat < 0.18 && colorfulness < 0.2) return brightness > 180 ? { category: 'GLASS', confidence: 0.62 } : { category: 'METALS', confidence: 0.66 };
    if (g > r && g > b && g - Math.max(r, b) > 12) return { category: 'BIOMASS', confidence: 0.7 };
    if (r > g && g > b && brightness < 140 && r - b > 25) return { category: 'WOOD', confidence: 0.6 };
    if (r > 90 && g > 80 && b < 70 && brightness < 130) return { category: 'OILS', confidence: 0.55 };
    if (b >= r || sat > 0.45) return { category: 'PLASTICS', confidence: 0.64 };
    if (colorfulness > 0.3) return { category: 'TEXTILE', confidence: 0.5 };
    return { category: 'PLASTICS', confidence: 0.4 };
  }
}
