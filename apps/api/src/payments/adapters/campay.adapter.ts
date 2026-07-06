import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentProvider, PayoutRequest, PayoutInitResult, WebhookResult } from '../payment-provider.interface';

/**
 * ADAPTATEUR RÉEL — Campay (agrégateur Orange Money / MTN MoMo Cameroun).
 * Production-ready : appelle la vraie API withdraw + vérifie la signature webhook.
 *
 * DÉPENDANCES EXTERNES MANQUANTES (à fournir pour activer) :
 *   - CAMPAY_TOKEN         : token API du compte marchand Campay
 *   - CAMPAY_WEBHOOK_KEY   : clé de signature des webhooks (HMAC)
 *   - CAMPAY_BASE_URL      : https://demo.campay.net/api (test) | https://campay.net/api (prod)
 *   - Compte marchand Campay validé (KYC) + solde de flottant approvisionné
 *   - URL publique HTTPS pour recevoir les webhooks
 *
 * Sélection via PAYMENT_PROVIDER=campay. Aucune modif du service métier requise.
 */
@Injectable()
export class CampayPaymentAdapter implements PaymentProvider {
  readonly name = 'campay';
  private readonly logger = new Logger('CampayPayment');
  private readonly base = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
  private readonly token = process.env.CAMPAY_TOKEN;
  private readonly webhookKey = process.env.CAMPAY_WEBHOOK_KEY;

  async initiatePayout(req: PayoutRequest): Promise<PayoutInitResult> {
    if (!this.token) throw new ServiceUnavailableException('CAMPAY_TOKEN manquant — compte marchand non configuré');
    const res = await fetch(`${this.base}/withdraw/`, {
      method: 'POST',
      headers: { Authorization: `Token ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: String(Math.floor(req.amount)),
        to: req.phone,
        description: `SymbioNexus payout ${req.payoutId}`,
        external_reference: req.payoutId,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Campay withdraw échec: ${res.status} ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(data?.message || 'Campay withdraw failed');
    }
    return { providerRef: data.reference, status: 'PROCESSING', raw: data };
  }

  verifyWebhook(rawBody: string, headers: Record<string, unknown>): boolean {
    if (!this.webhookKey) return false;
    const sig = String(headers['x-campay-signature'] || headers['signature'] || '');
    const expected = crypto.createHmac('sha256', this.webhookKey).update(rawBody).digest('hex');
    // Comparaison à temps constant (anti timing-attack).
    return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  parseWebhook(body: any): WebhookResult {
    const s = String(body?.status || '').toUpperCase();
    const status = s === 'SUCCESSFUL' ? 'CONFIRMED' : s === 'FAILED' ? 'FAILED' : 'PROCESSING';
    return { providerRef: body?.reference, status, failureReason: body?.reason };
  }
}
