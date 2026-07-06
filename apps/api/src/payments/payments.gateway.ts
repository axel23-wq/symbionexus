import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Diffusion temps réel des décaissements + maj wallet (même serveur Socket.io partagé).
@WebSocketGateway({ cors: { origin: '*' } })
export class PaymentsGateway {
  @WebSocketServer() server: Server;

  emitPayout(payout: any) {
    this.server?.emit('payout:update', payout);
  }

  emitWallet(data: { userId: string; balance: number; tx: any }) {
    this.server?.emit('wallet:update', data);
  }
}
