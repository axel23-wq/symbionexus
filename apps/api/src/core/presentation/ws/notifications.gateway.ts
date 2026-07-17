import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to store connected clients: userId -> socketId[]
  private connectedUsers = new Map<string, string[]>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Expect token in query string or headers
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'jwt-secret-dev',
      });
      
      const userId = payload.sub;
      client.data.user = payload; // Attach user to socket

      // Add socket to user's list
      const userSockets = this.connectedUsers.get(userId) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(userId, userSockets);

      // Join a room specific to this user to make targeting easier
      client.join(`user_${userId}`);
      
      console.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (err) {
      console.log(`Connection rejected for client ${client.id}: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub;
    if (userId) {
      let userSockets = this.connectedUsers.get(userId) || [];
      userSockets = userSockets.filter((id) => id !== client.id);
      
      if (userSockets.length === 0) {
        this.connectedUsers.delete(userId);
      } else {
        this.connectedUsers.set(userId, userSockets);
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  // Method called by CQRS handlers to push notifications
  sendNotificationToUser(userId: string, notification: any) {
    // Send event to the user's dedicated room
    this.server.to(`user_${userId}`).emit('new_notification', notification);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): string {
    return 'pong';
  }
}
