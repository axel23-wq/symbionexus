import { Module, Logger } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PayoutService } from './payments.service';
import { PaymentsGateway } from './payments.gateway';
import { DevPaymentAdapter } from './adapters/dev.adapter';
import { CampayPaymentAdapter } from './adapters/campay.adapter';
import { PAYMENT_PROVIDER } from './payment-provider.interface';

/**
 * Sélection de l'adaptateur de paiement à l'exécution via PAYMENT_PROVIDER.
 *   dev (défaut) → DevPaymentAdapter (temporaire, aucun argent réel)
 *   campay       → CampayPaymentAdapter (réel, requiert CAMPAY_TOKEN + webhook key)
 * Changer de prestataire = 1 variable d'env, zéro modif du service métier.
 */
const paymentProviderFactory = {
  provide: PAYMENT_PROVIDER,
  useFactory: (dev: DevPaymentAdapter, campay: CampayPaymentAdapter) => {
    const sel = (process.env.PAYMENT_PROVIDER || 'dev').toLowerCase();
    const chosen = sel === 'campay' ? campay : dev;
    new Logger('Payments').log(`Prestataire de paiement actif : ${chosen.name}`);
    return chosen;
  },
  inject: [DevPaymentAdapter, CampayPaymentAdapter],
};

@Module({
  controllers: [PaymentsController],
  providers: [PayoutService, PaymentsGateway, DevPaymentAdapter, CampayPaymentAdapter, paymentProviderFactory],
})
export class PaymentsModule {}
