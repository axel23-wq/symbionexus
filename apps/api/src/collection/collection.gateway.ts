import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Diffusion temps réel des changements d'état de collecte (real-time system).
@WebSocketGateway({ cors: { origin: '*' } })
export class CollectionGateway {
  @WebSocketServer() server: Server;

  // Push la demande complète (l'UI applique le payload directement, sans refetch).
  emitUpdate(request: any) {
    this.server?.emit('collection:update', request);
  }

  // Push la mise à jour wallet + nouvelle ligne de ledger (temps réel financier).
  emitWallet(data: { userId: string; balance: number; tx: any }) {
    this.server?.emit('wallet:update', data);
  }

  // Progression de l'analyse Vision IA (photo/vidéo) en direct.
  emitVisionProgress(data: { userId: string; pct: number; frame?: number; total?: number; stage: string }) {
    this.server?.emit('vision:progress', data);
  }
}
