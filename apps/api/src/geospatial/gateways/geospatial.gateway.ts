import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/geospatial',
  transports: ['websocket', 'polling'],
})
export class GeospatialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GeospatialGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté (Geospatial) : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté (Geospatial) : ${client.id}`);
  }

  /**
   * Diffuser une mise à jour de localisation (ex: un camion de collecte en mouvement)
   */
  broadcastLocationUpdate(entityId: string, lat: number, lng: number) {
    this.server.emit('location_update', { entityId, lat, lng, timestamp: new Date() });
  }

  /**
   * Recevoir une mise à jour d'un client (ex: application mobile du collecteur)
   */
  @SubscribeMessage('update_my_location')
  handleLocationUpdate(client: Socket, payload: { lat: number; lng: number }) {
    this.logger.log(`Mise à jour reçue du client ${client.id}: [${payload.lat}, ${payload.lng}]`);
    // Ici, nous pourrions déclencher une Commande CQRS pour enregistrer cette position dans PostGIS
    // this.commandBus.execute(new UpdateEntityLocationCommand(client.id, payload.lat, payload.lng));
    
    // Pour l'instant, on broadcast simplement aux autres abonnés
    client.broadcast.emit('entity_moved', { clientId: client.id, ...payload });
  }
}
