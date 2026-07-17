import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Diffusion temps réel des décaissements + maj wallet (même serveur Socket.io partagé).
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class PaymentsGateway {
  @WebSocketServer() server: Server;

  emitPayout(payout: any) {
    this.server?.emit('payout:update', payout);
  }

  emitWallet(data: { userId: string; balance: number; tx: any }) {
    this.server?.emit('wallet:update', data);
  }

  emitLiveEvent(evt: { type: string; payload?: any; userId?: string; createdAt?: Date }) {
    this.server?.emit('event:live', evt);
  }
}
