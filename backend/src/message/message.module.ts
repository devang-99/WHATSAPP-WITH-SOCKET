import { Module } from '@nestjs/common';
import { MessagesService } from './message.service';
import { MessagesController } from './message.controller';
import { User } from 'src/user/entities/user.entity';
import { Message } from './entities/message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Message])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessageModule {}
