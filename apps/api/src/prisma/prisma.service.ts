import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Neon (serverless gratuit) se met en veille au repos. Une 1re connexion
    // échoue alors (P1001). On réessaie avec backoff — ce qui réveille Neon —
    // et on NE fait JAMAIS planter le démarrage : au pire Prisma se (re)connecte
    // automatiquement à la première requête.
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.$connect();
        return;
      } catch {
        if (attempt === 5) {
          // eslint-disable-next-line no-console
          console.warn('[Prisma] Connexion différée (Neon en veille) — reconnexion à la première requête.');
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
