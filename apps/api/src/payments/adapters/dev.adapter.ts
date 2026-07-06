import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PayoutRequest, PayoutInitResult, WebhookResult } from '../payment-provider.interface';

/**
 * ⚠️ ADAPTATEUR DEV TEMPORAIRE — outil de développement/test uniquement.
 * NE règle AUCUN argent réel. Il accepte l'ordre (PROCESSING) puis attend une
 * confirmation via l'endpoint dev `POST /payments/dev/confirm` (qui simule le
 * webhook prestataire). Remplaçable par CampayAdapter/MtnAdapter en changeant
 * uniquement PAYMENT_PROVIDER dans .env — aucune modif du service métier.
 */
@Injectable()
export class DevPaymentAdapter implements PaymentProvider {
  readonly name = 'dev';
  private readonly logger = new Logger('DevPayment');

  async initiatePayout(req: PayoutRequest): Promise<PayoutInitResult> {
    this.logger.warn(`[DEV] payout simulé ${req.amount} ${req.currency} → ${req.phone} (aucun argent réel)`);
    return { providerRef: `dev_${req.payoutId}`, status: 'PROCESSING' };
  }

  // Dev : pas de signature. En production, un vrai adaptateur DOIT vérifier le HMAC.
  verifyWebhook(): boolean {
    return true;
  }

  parseWebhook(body: any): WebhookResult {
    return { providerRef: body?.providerRef, status: body?.status, failureReason: body?.failureReason };
  }
}
