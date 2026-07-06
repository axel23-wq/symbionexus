/**
 * PORT — contrat d'un prestataire de paiement Mobile Money.
 * L'architecture ne dépend QUE de cette interface. Les adaptateurs réels
 * (Campay / MTN MoMo / Orange Money) ou l'adaptateur dev temporaire sont
 * interchangeables SANS modifier le service métier (Dependency Inversion).
 */
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export type PayoutState = 'PROCESSING' | 'CONFIRMED' | 'FAILED';

export interface PayoutRequest {
  payoutId: string; // référence interne (external_reference côté prestataire)
  amount: number;
  currency: string; // XAF
  phone: string; // numéro Mobile Money destinataire
}

export interface PayoutInitResult {
  providerRef: string; // id transaction prestataire
  status: PayoutState; // PROCESSING normalement ; CONFIRMED si règlement instantané
  raw?: unknown;
}

export interface WebhookResult {
  providerRef: string;
  status: PayoutState;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Envoie l'ordre de décaissement au prestataire. */
  initiatePayout(req: PayoutRequest): Promise<PayoutInitResult>;
  /** Vérifie l'authenticité d'un webhook entrant (signature HMAC). */
  verifyWebhook(rawBody: string, headers: Record<string, unknown>): boolean;
  /** Normalise le payload webhook du prestataire vers notre modèle. */
  parseWebhook(body: unknown): WebhookResult;
}
