import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsGateway } from './payments.gateway';
import { PAYMENT_PROVIDER, PaymentProvider, WebhookResult } from './payment-provider.interface';

const MIN_PAYOUT_XAF = 100;

/**
 * Orchestrateur de décaissement Mobile Money — flux réel, event-driven.
 * Débit wallet atomique → ordre prestataire → statut piloté par webhook.
 * En cas d'échec : recrédit automatique du wallet. Aucune simulation permanente.
 */
@Injectable()
export class PayoutService {
  private readonly logger = new Logger('Payout');

  constructor(
    private prisma: PrismaService,
    private gateway: PaymentsGateway,
    @Inject(PAYMENT_PROVIDER) private provider: PaymentProvider,
  ) {}

  private async event(type: string, payload: any, userId?: string) {
    await this.prisma.systemEvent.create({ data: { type, payload, userId } });
  }
  private async audit(userId: string, action: string, metadata?: any) {
    try { await this.prisma.auditLog.create({ data: { userId, action, status: 'SUCCESS', metadata } }); } catch { /* best-effort */ }
  }

  /** Débite le wallet et crée le décaissement, puis délègue au prestataire. */
  async requestPayout(userId: string, amountRaw: number, phone: string) {
    const amount = Math.floor(Number(amountRaw));
    if (!Number.isFinite(amount) || amount < MIN_PAYOUT_XAF) throw new BadRequestException(`Montant minimum ${MIN_PAYOUT_XAF} XAF`);
    if (!phone || phone.trim().length < 8) throw new BadRequestException('Numéro Mobile Money invalide');

    // 1) Transaction atomique : vérif solde + débit + trace + payout PENDING.
    const { payout, wallet, debitTx } = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) throw new BadRequestException('Solde insuffisant');
      const updated = await tx.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
      const debitTx = await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'PAYOUT', amount, reference: `payout:${phone}` } });
      const payout = await tx.payout.create({ data: { userId, walletId: wallet.id, amount, phone: phone.trim(), provider: this.provider.name, status: 'PENDING' } });
      return { payout, wallet: updated, debitTx };
    });

    await this.event('PayoutInitiated', { payoutId: payout.id, amount, phone, provider: this.provider.name }, userId);
    await this.audit(userId, 'payout.request', { payoutId: payout.id, amount, provider: this.provider.name });
    // Débit visible en temps réel immédiatement.
    this.gateway.emitWallet({ userId, balance: wallet.balance, tx: debitTx });
    this.gateway.emitPayout(payout);

    // 2) Ordre prestataire (hors transaction DB). Échec → recrédit.
    try {
      const res = await this.provider.initiatePayout({ payoutId: payout.id, amount, currency: 'XAF', phone: phone.trim() });
      const state = res.status === 'CONFIRMED' ? 'CONFIRMED' : 'PROCESSING';
      const up = await this.prisma.payout.update({ where: { id: payout.id }, data: { status: state, providerRef: res.providerRef } });
      await this.event('PayoutProcessing', { payoutId: up.id, providerRef: res.providerRef }, userId);
      this.gateway.emitPayout(up);
      if (state === 'CONFIRMED') return this.markConfirmed(up.id); // prestataire instantané
      return up;
    } catch (e: any) {
      this.logger.error(`Payout ${payout.id} rejeté par prestataire: ${e?.message}`);
      await this.refund(payout.id, e?.message || 'Prestataire indisponible');
      throw new BadRequestException(`Échec décaissement : ${e?.message || 'prestataire indisponible'}`);
    }
  }

  /** Webhook prestataire (source de vérité du règlement réel). Idempotent. */
  async handleWebhook(providerName: string, parsed: WebhookResult) {
    if (!parsed?.providerRef) throw new BadRequestException('providerRef manquant');
    const payout = await this.prisma.payout.findFirst({ where: { providerRef: parsed.providerRef } });
    if (!payout) throw new NotFoundException('Décaissement introuvable');
    if (payout.status === 'CONFIRMED' || payout.status === 'FAILED') return payout; // déjà finalisé
    if (parsed.status === 'CONFIRMED') return this.markConfirmed(payout.id);
    if (parsed.status === 'FAILED') return this.refund(payout.id, parsed.failureReason || 'Échec prestataire');
    return payout;
  }

  private async markConfirmed(id: string) {
    const up = await this.prisma.payout.update({ where: { id }, data: { status: 'CONFIRMED' } });
    await this.event('PayoutConfirmed', { payoutId: id, amount: up.amount }, up.userId);
    await this.audit(up.userId, 'payout.confirmed', { payoutId: id, amount: up.amount });
    this.gateway.emitPayout(up);
    return up;
  }

  /** Recrédit atomique du wallet sur échec + marque FAILED. */
  private async refund(id: string, reason: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.update({ where: { id }, data: { status: 'FAILED', failureReason: reason } });
      const wallet = await tx.wallet.update({ where: { id: payout.walletId }, data: { balance: { increment: payout.amount } } });
      const creditTx = await tx.walletTransaction.create({ data: { walletId: payout.walletId, type: 'CREDIT', amount: payout.amount, reference: `refund:${id}` } });
      return { payout, wallet, creditTx };
    });
    await this.event('PayoutFailed', { payoutId: id, reason, refunded: result.payout.amount }, result.payout.userId);
    await this.audit(result.payout.userId, 'payout.failed', { payoutId: id, reason });
    this.gateway.emitWallet({ userId: result.payout.userId, balance: result.wallet.balance, tx: result.creditTx });
    this.gateway.emitPayout(result.payout);
    return result.payout;
  }

  async myPayouts(userId: string) {
    return this.prisma.payout.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
