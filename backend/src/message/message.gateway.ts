/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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
  cors: { origin: '*' },
  transports: ['websocket'],
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

  // userid -> socketId
  private readonly connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log('Socket connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    const entry = [...this.connectedUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    );

    if (entry) {
      const [userid] = entry;

      await this.userRepository.update({ userid }, { isOnline: false });

      this.connectedUsers.delete(userid);

      this.server.emit('userOffline', { userid });
      console.log(`User offline: ${userid}`);
    }
  }

  /* ================= USER ONLINE ================= */

  @SubscribeMessage('onConnection')
  async onConnection(
    @MessageBody() userid: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!userid) return;

    await this.userRepository.update({ userid }, { isOnline: true });

    this.connectedUsers.set(userid, client.id);

    this.server.emit('userOnline', { userid });

    console.log('User online:', userid);
  }

  /* ================= USER OFFLINE ================= */

  @SubscribeMessage('onDisconnection')
  async onDisconnection(@MessageBody() userid: string) {
    if (!userid) return;

    await this.userRepository.update({ userid }, { isOnline: false });

    this.connectedUsers.delete(userid);
    this.server.emit('userOffline', { userid });
  }

  /* ================= TYPING ================= */

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any) {
    const receiverSocket = this.connectedUsers.get(data.receiverId);

    if (receiverSocket) {
      this.server.to(receiverSocket).emit('usertyping', {
        userid: data.userid,
      });
    }
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

    const receiverSocket = this.connectedUsers.get(receiverId);

    if (receiverSocket) {
      this.server.to(receiverSocket).emit('newMessage', message);
    }

    const senderSocket = this.connectedUsers.get(senderId);
    if (senderSocket) {
      this.server.to(senderSocket).emit('newMessage', message);
    }
  }
}
