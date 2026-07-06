import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Jimp } from 'jimp';

export interface VisionResult {
  category: string;          // catégorie déchet détectée
  confidence: number;        // 0..1 force de la classification
  quality: number;           // 0..1 netteté / état matière
  estimatedWeightKg: number; // pré-estimation (confirmée ensuite à la pesée réelle)
  features: {                // features réelles extraites des pixels (traçable/auditables)
    width: number; height: number;
    avgR: number; avgG: number; avgB: number;
    brightness: number; saturation: number; sharpness: number;
  };
}

/**
 * Service IA Vision RÉEL (analyse pixels via jimp — pas de mock frontend).
 * Décode l'image, extrait des features réelles (couleur moyenne, luminosité,
 * saturation, netteté) puis classe le déchet par heuristique déterministe.
 * Pluggable vers une Vision API (embeddings/CNN) en V2 sans changer le contrat.
 */
@Injectable()
export class AiVisionService {
  private readonly logger = new Logger('AiVision');

  async analyze(imageBase64: string): Promise<VisionResult> {
    const raw = (imageBase64 || '').split(',').pop() || '';
    if (raw.length < 32) throw new BadRequestException('Image invalide ou vide');

    let img: Awaited<ReturnType<typeof Jimp.read>>;
    try {
      img = await Jimp.read(Buffer.from(raw, 'base64'));
    } catch {
      throw new BadRequestException('Décodage image échoué (format non supporté)');
    }

    const width = img.bitmap.width;
    const height = img.bitmap.height;
    // Sous-échantillonne pour rapidité (<200ms) tout en gardant l'analyse réelle.
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
      sumLum += lum;
      sumSat += max === 0 ? 0 : (max - min) / max;
      lums.push(lum);
    }
    const avgR = sumR / n, avgG = sumG / n, avgB = sumB / n;
    const brightness = sumLum / n;          // 0..255
    const saturation = sumSat / n;          // 0..1
    // Netteté = variance de luminosité (proxy réel de la finesse de détails).
    const meanLum = brightness;
    let varLum = 0;
    for (const l of lums) varLum += (l - meanLum) ** 2;
    const sharpness = Math.min(1, Math.sqrt(varLum / n) / 64); // 0..1 normalisé

    const { category, confidence } = this.classify(avgR, avgG, avgB, brightness, saturation);
    // Qualité matière : nette + ni trop sombre ni cramée.
    const exposure = 1 - Math.abs(brightness - 128) / 128;
    const quality = Math.max(0.15, Math.min(1, 0.6 * sharpness + 0.4 * exposure));
    // Pré-estimation poids : proxy taille objet (résolution source) borné. Confirmé à la pesée.
    const sizeFactor = Math.min(1, (width * height) / (1600 * 1200));
    const estimatedWeightKg = Math.round((1 + sizeFactor * 14) * 10) / 10; // 1..15 kg

    const result: VisionResult = {
      category, confidence, quality, estimatedWeightKg,
      features: {
        width, height,
        avgR: Math.round(avgR), avgG: Math.round(avgG), avgB: Math.round(avgB),
        brightness: Math.round(brightness), saturation: Math.round(saturation * 100) / 100,
        sharpness: Math.round(sharpness * 100) / 100,
      },
    };
    this.logger.log(`Vision → ${category} (${(confidence * 100) | 0}%) ~${estimatedWeightKg}kg`);
    return result;
  }

  /** Classification déterministe sur features couleur réelles. */
  private classify(r: number, g: number, b: number, brightness: number, sat: number): { category: string; confidence: number } {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const colorfulness = (max - min) / 255; // 0..1

    // Gris / faible saturation → métal (mat) ou verre (brillant/clair).
    if (sat < 0.18 && colorfulness < 0.2) {
      return brightness > 180
        ? { category: 'GLASS', confidence: 0.62 }
        : { category: 'METALS', confidence: 0.66 };
    }
    // Vert dominant → biomasse / organique.
    if (g > r && g > b && g - Math.max(r, b) > 12) {
      return { category: 'BIOMASS', confidence: 0.7 };
    }
    // Brun (R>G>B, sombre) → bois.
    if (r > g && g > b && brightness < 140 && r - b > 25) {
      return { category: 'WOOD', confidence: 0.6 };
    }
    // Jaune/olive sombre saturé → huiles.
    if (r > 90 && g > 80 && b < 70 && brightness < 130) {
      return { category: 'OILS', confidence: 0.55 };
    }
    // Bleu/cyan ou couleur vive saturée → plastique.
    if (b >= r || sat > 0.45) {
      return { category: 'PLASTICS', confidence: 0.64 };
    }
    // Multicolore riche mais mat → textile.
    if (colorfulness > 0.3) {
      return { category: 'TEXTILE', confidence: 0.5 };
    }
    return { category: 'PLASTICS', confidence: 0.4 }; // défaut prudent
  }
}
