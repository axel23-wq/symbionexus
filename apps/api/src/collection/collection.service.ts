import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectionGateway } from './collection.gateway';
import { VISION_PROVIDER, VisionProvider } from './vision/vision-provider.interface';
import { VideoAnalysisService } from './vision/video-analysis.service';

// Prix d'achat citoyen (FCFA/kg) — source autoritaire backend.
const PRICE_FCFA: Record<string, number> = {
  METALS: 665, PLASTICS: 265, BIOMASS: 65, WOOD: 55,
  TEXTILE: 180, OILS: 38, GLASS: 43, CHEMICAL: 425,
};

// CO2 évité par kg recyclé (kg CO2e / kg matière) — facteurs indicatifs.
const CO2_FACTOR: Record<string, number> = {
  METALS: 4, PLASTICS: 2, BIOMASS: 0.5, WOOD: 0.9,
  TEXTILE: 3, OILS: 1.5, GLASS: 0.3, CHEMICAL: 2,
};

@Injectable()
export class CollectionService {
  constructor(
    private prisma: PrismaService,
    private gateway: CollectionGateway,
    @Inject(VISION_PROVIDER) private vision: VisionProvider,
    private video: VideoAnalysisService,
  ) {}

  /** Journal d'événement immuable (event engine) + diffusion live (salle de contrôle). */
  private async event(type: string, payload: any, userId?: string) {
    await this.prisma.systemEvent.create({ data: { type, payload, userId } });
    this.gateway.emitLiveEvent({ type, payload, userId, createdAt: new Date() });
  }

  /** Piste d'audit réelle (AuditLog) — traçabilité de chaque action. */
  private async audit(userId: string, action: string, metadata?: any) {
    try {
      await this.prisma.auditLog.create({ data: { userId, action, status: 'SUCCESS', metadata } });
    } catch { /* audit best-effort, ne bloque pas le flux métier */ }
  }

  /**
   * Pipeline IA Vision RÉEL : MediaUploaded → AIVisionProcessed → PriceCalculated.
   * Analyse pixels backend (jimp), calcule le prix, persiste events + audit, broadcast.
   */
  async analyzeMedia(userId: string, imageBase64: string) {
    await this.event('MediaUploaded', { kind: 'image', bytes: (imageBase64 || '').length }, userId);
    await this.event('VisionStarted', { kind: 'image', provider: this.vision.name }, userId);
    this.gateway.emitVisionProgress({ userId, pct: 10, stage: 'Analyse IA…' });
    const ai = await this.vision.analyze(imageBase64);
    this.gateway.emitVisionProgress({ userId, pct: 100, stage: 'Analyse terminée' });
    await this.event('VisionCompleted', ai, userId);
    return this.priceAndReturn(userId, ai);
  }

  /** Pipeline vidéo : keyframes FFmpeg → analyse par frame → fusion (progress temps réel). */
  async analyzeVideoMedia(userId: string, videoBase64: string) {
    await this.event('MediaUploaded', { kind: 'video', bytes: (videoBase64 || '').length }, userId);
    await this.event('VisionStarted', { kind: 'video', provider: this.vision.name }, userId);
    const ai = await this.video.analyzeVideo(videoBase64, (pct, frame, total) => {
      this.gateway.emitVisionProgress({ userId, pct, frame, total, stage: `Frame ${frame}/${total}` });
    });
    await this.event('VisionCompleted', ai, userId);
    return this.priceAndReturn(userId, ai);
  }

  /** Prix + PriceCalculated + audit, commun photo/vidéo. */
  private async priceAndReturn(userId: string, ai: any) {
    const pricePerKg = PRICE_FCFA[ai.category] ?? 100;
    const estimatedValue = Math.round(ai.estimatedWeightKg * pricePerKg);
    await this.event('PriceCalculated', { category: ai.category, pricePerKg, estimatedWeightKg: ai.estimatedWeightKg, estimatedValue }, userId);
    await this.audit(userId, 'collection.vision.analyze', { category: ai.category, provider: ai.provider, confidence: ai.confidence, estimatedValue });
    return { ...ai, pricePerKg, estimatedValue };
  }

  // Push la demande complète → l'UI applique le payload directement (zéro refetch/polling).
  private broadcast(req: any) {
    this.gateway.emitUpdate(req);
  }

  /** WasteSubmitted : le citoyen soumet un déchet → demande réelle en base. */
  async submit(userId: string, dto: { materialCategory: string; declaredWeightKg: number; phone?: string; latitude?: number; longitude?: number }) {
    const pricePerKg = PRICE_FCFA[dto.materialCategory] ?? 100;
    const estimatedValue = Math.round(Math.max(0, dto.declaredWeightKg) * pricePerKg);
    const req = await this.prisma.collectionRequest.create({
      data: {
        userId,
        materialCategory: dto.materialCategory,
        declaredWeightKg: dto.declaredWeightKg,
        pricePerKg,
        estimatedValue,
        phone: dto.phone,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'SUBMITTED',
      },
    });
    await this.event('WasteSubmitted', { id: req.id, materialCategory: req.materialCategory, estimatedValue }, userId);
    await this.audit(userId, 'collection.submit', { id: req.id, materialCategory: req.materialCategory, estimatedValue });
    await this.broadcast(req);
    return req;
  }

  /** CollectorAssigned : assigne le 1er transporteur disponible (MVP ; nearest = increment 2). */
  async assign(id: string) {
    const req = await this.get(id);
    const collector = await this.prisma.user.findFirst({ where: { role: { name: 'TRANSPORTER' } }, select: { id: true } });
    const updated = await this.prisma.collectionRequest.update({
      where: { id }, data: { status: 'ASSIGNED', collectorUserId: collector?.id ?? null },
    });
    await this.event('CollectorAssigned', { id, collectorUserId: collector?.id }, req.userId);
    await this.audit(req.userId, 'collection.assign', { id, collectorUserId: collector?.id });
    await this.broadcast(updated);
    return updated;
  }

  /** Transitions transport (PickupStarted / PICKED_UP). */
  async setStatus(id: string, status: 'EN_ROUTE' | 'PICKED_UP') {
    const req = await this.get(id);
    const updated = await this.prisma.collectionRequest.update({ where: { id }, data: { status } });
    await this.event(status === 'EN_ROUTE' ? 'PickupStarted' : 'PickedUp', { id }, req.userId);
    await this.broadcast(updated);
    return updated;
  }

  /** WeightValidated : pesée réelle au centre → valeur finale. */
  async validateWeight(id: string, validatedWeightKg: number) {
    const req = await this.get(id);
    const finalValue = Math.round(Math.max(0, validatedWeightKg) * req.pricePerKg);
    const updated = await this.prisma.collectionRequest.update({
      where: { id }, data: { validatedWeightKg, finalValue, status: 'VALIDATED' },
    });
    await this.event('WeightValidated', { id, validatedWeightKg, finalValue }, req.userId);
    await this.event('WeightVerified', { id, validatedWeightKg, category: req.materialCategory }, req.userId);
    await this.audit(req.userId, 'collection.validate', { id, validatedWeightKg, finalValue });
    await this.broadcast(updated);
    // Boucle interne événementielle : Carbone → Notification → Analytics.
    await this.afterWeightVerified(req.userId, req.materialCategory, validatedWeightKg, finalValue);
    return updated;
  }

  /** PaymentTriggered : crédite le wallet réel + ligne de ledger. Aucune simulation. */
  async pay(id: string) {
    const req = await this.get(id);
    if (req.status !== 'VALIDATED') throw new BadRequestException('La collecte doit être validée (pesée) avant paiement.');
    const amount = req.finalValue ?? req.estimatedValue;

    const result = await this.prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: req.userId },
        create: { userId: req.userId, balance: amount },
        update: { balance: { increment: amount } },
      });
      const walletTx = await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'CREDIT', amount, reference: req.id } });
      const updated = await tx.collectionRequest.update({ where: { id }, data: { status: 'PAID' } });
      return { wallet, updated, walletTx };
    });

    await this.event('PaymentTriggered', { id, amount, walletId: result.wallet.id, balance: result.wallet.balance }, req.userId);
    await this.event('WalletUpdated', { walletId: result.wallet.id, balance: result.wallet.balance }, req.userId);
    await this.audit(req.userId, 'collection.pay', { id, amount, balance: result.wallet.balance });
    this.broadcast(result.updated);
    // Push financier temps réel : solde + nouvelle ligne de ledger appliqués directement dans l'UI.
    this.gateway.emitWallet({ userId: req.userId, balance: result.wallet.balance, tx: result.walletTx });
    return { request: result.updated, wallet: result.wallet, amount };
  }

  /** Boucle interne : CarbonUpdated → NotificationSent → AnalyticsUpdated. */
  private async afterWeightVerified(userId: string, category: string, weightKg: number, value: number) {
    // 1) Carbone
    const co2Kg = Math.round((weightKg * (CO2_FACTOR[category] ?? 1)) * 100) / 100;
    await this.event('CarbonUpdated', { category, weightKg, co2Kg }, userId);
    // 2) Notification réelle (persistée)
    const notif = await this.prisma.notification.create({
      data: { userId, type: 'SYSTEM', title: 'Pesée validée ✅', message: `${weightKg} kg de ${category} validés — ${value} FCFA, ${co2Kg} kg CO₂ évités.` },
    });
    await this.event('NotificationSent', { notifId: notif.id }, userId);
    this.gateway.emitNotification(notif);
    // 3) Analytics
    await this.event('AnalyticsUpdated', { co2Kg, value }, userId);
    this.gateway.emitAnalytics();
  }

  /** Agrégats plateforme temps réel (salle de contrôle). */
  async getAnalytics() {
    const [byStatus, paidAgg, carbonEvents, aiCount, payoutAgg, recent] = await Promise.all([
      this.prisma.collectionRequest.groupBy({ by: ['status'], _count: true }),
      this.prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { type: 'CREDIT' } }),
      this.prisma.systemEvent.findMany({ where: { type: 'CarbonUpdated' }, select: { payload: true }, take: 2000 }),
      this.prisma.systemEvent.count({ where: { type: 'VisionCompleted' } }),
      this.prisma.payout.aggregate({ _sum: { amount: true }, where: { status: 'CONFIRMED' } }),
      this.prisma.systemEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    ]);
    const co2Total = Math.round(carbonEvents.reduce((s: number, e: any) => s + (e.payload?.co2Kg || 0), 0) * 100) / 100;
    return {
      collectionsByStatus: byStatus.map((b: any) => ({ status: b.status, count: b._count })),
      collectionsTotal: byStatus.reduce((s: number, b: any) => s + b._count, 0),
      creditedTotal: paidAgg._sum.amount || 0,
      payoutConfirmedTotal: payoutAgg._sum.amount || 0,
      co2Total,
      aiAnalyses: aiCount,
      recentEvents: recent,
    };
  }

  async get(id: string) {
    const req = await this.prisma.collectionRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Demande de collecte non trouvée');
    return req;
  }

  async myRequests(userId: string) {
    return this.prisma.collectionRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /** SymbioWallet : solde + registre (ledger). */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId }, create: { userId }, update: {},
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    return wallet;
  }
}
