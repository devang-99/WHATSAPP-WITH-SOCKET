/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  @WebSocketServer()
  server: Server;

  /* ================= SOCKET CONNECT ================= */

  handleConnection(client: Socket) {
    console.log('Socket connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log('Socket disconnected:', client.id);

    const userid = client.data.userid;
    if (!userid) return;

    // check if any sockets of this user still exist
    const sockets = await this.server.in(userid).fetchSockets();

    if (sockets.length === 0) {
      await this.userRepository.update({ userid }, { isOnline: false });

      this.server.emit('userOffline', { userid });

      console.log(`User ${userid} offline`);
    }
  }

  /* ================= USER ONLINE ================= */

  @SubscribeMessage('onConnection')
  async onConnection(
    @MessageBody() userid: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!userid) return;
    // store userid on socket
    client.data.userid = userid;

    // join personal room
    await client.join(userid);

    await this.userRepository.update({ userid }, { isOnline: true });

    this.server.emit('userOnline', { userid });

    console.log(`User ${userid} joined personal room`);
  }

  /* =========================================================
        ⭐ JOIN ROOM (REAL SOCKET.IO ROOM)
     ========================================================= */

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(roomId);
    console.log(`Socket ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(roomId);
    console.log(`Socket ${client.id} left room ${roomId}`);
  }

  /* ================= TYPING ================= */

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { roomId, userid } = data;

    // send to everyone EXCEPT sender
    client.to(roomId).emit('usertyping', { userid });
  }

  /* ================= FETCH MESSAGES ================= */

  @SubscribeMessage('fetchMessages')
  async fetchMessages(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });

    client.emit('getMessages', messages);
  }

  /* ================= SEND MESSAGE ================= */

  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() data: any) {
    const { roomId, text, senderId, receiverId } = data;

    if (!roomId || !senderId || !receiverId) return;

    const message = await this.messageRepository.save({
      roomId,
      senderId,
      receiverId,
      message: text,
    });

    // ✅ broadcast message to everyone in room
    this.server.to(roomId).emit('newMessage', message);
  }
}
