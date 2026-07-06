import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import ffmpeg = require('fluent-ffmpeg');
import { VISION_PROVIDER, VisionProvider, VisionAnalysis, WasteCategory } from './vision-provider.interface';

// CJS require : ffmpeg-static exporte directement le chemin du binaire (pas de default ESM).
const ffmpegPath: string | null = require('ffmpeg-static');
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const MAX_FRAMES = 6;

/**
 * Pipeline vidéo RÉEL : décode la vidéo, extrait des keyframes via FFmpeg,
 * analyse CHAQUE frame avec le moteur Vision IA, puis fusionne les résultats.
 * Aucune valeur inventée : tout provient de l'analyse des frames.
 */
@Injectable()
export class VideoAnalysisService {
  private readonly logger = new Logger('VideoAnalysis');
  constructor(@Inject(VISION_PROVIDER) private vision: VisionProvider) {}

  async analyzeVideo(videoBase64: string, onProgress?: (pct: number, frame: number, total: number) => void): Promise<VisionAnalysis & { frames: number }> {
    const raw = (videoBase64 || '').split(',').pop() || '';
    if (raw.length < 100) throw new BadRequestException('Vidéo invalide ou vide');

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbio-vid-'));
    const input = path.join(dir, 'in.mp4');
    try {
      await fs.writeFile(input, Buffer.from(raw, 'base64'));
      const frames = await this.extractKeyframes(input, dir);
      if (!frames.length) throw new BadRequestException('Aucune frame extraite de la vidéo');

      const results: VisionAnalysis[] = [];
      for (let i = 0; i < frames.length; i++) {
        const b64 = 'data:image/png;base64,' + (await fs.readFile(frames[i])).toString('base64');
        results.push(await this.vision.analyze(b64));
        onProgress?.(Math.round(((i + 1) / frames.length) * 100), i + 1, frames.length);
      }
      return { ...this.merge(results), frames: results.length };
    } finally {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /** Extrait jusqu'à MAX_FRAMES keyframes (1 image/s). */
  private extractKeyframes(input: string, dir: string): Promise<string[]> {
    const pattern = path.join(dir, 'f-%03d.png');
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .outputOptions(['-vf', 'fps=1', '-frames:v', String(MAX_FRAMES)])
        .on('end', async () => {
          const files = (await fs.readdir(dir)).filter((f) => f.startsWith('f-')).sort().map((f) => path.join(dir, f));
          resolve(files);
        })
        .on('error', (e) => reject(new BadRequestException('FFmpeg: ' + e.message)))
        .save(pattern);
    });
  }

  /** Fusion intelligente multi-frames : vote pondéré catégorie, union matières/contaminants. */
  private merge(rs: VisionAnalysis[]): VisionAnalysis {
    // Vote catégorie pondéré par confiance.
    const votes: Record<string, number> = {};
    for (const r of rs) votes[r.category] = (votes[r.category] || 0) + r.confidence;
    const category = (Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'PLASTICS') as WasteCategory;
    const inCat = rs.filter((r) => r.category === category);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const objMap = new Map<string, number>();
    const contam = new Set<string>();
    const materials = new Set<string>();
    for (const r of rs) {
      r.objects.forEach((o) => objMap.set(o.label, Math.max(objMap.get(o.label) || 0, o.confidence)));
      r.contamination.forEach((c) => contam.add(c));
      materials.add(r.material);
    }
    return {
      category,
      material: [...materials].filter(Boolean).join(', ') || 'inconnu',
      objects: [...objMap.entries()].map(([label, confidence]) => ({ label, confidence })).slice(0, 12),
      quality: avg(rs.map((r) => r.quality)),
      recyclability: avg(rs.map((r) => r.recyclability)),
      contamination: [...contam].slice(0, 10),
      estimatedWeightKg: Math.max(...rs.map((r) => r.estimatedWeightKg)),
      confidence: avg(inCat.map((r) => r.confidence)),
      provider: rs[0]?.provider || 'unknown',
      notes: `fusion de ${rs.length} frames`,
    };
  }
}
