import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString({ message: 'room id must be a string' })
  @IsOptional()
  roomId: string;

  @IsString({ message: 'sender id must be a string' })
  @IsOptional()
  senderId: string;

  @IsString({ message: 'reciever id must be a string' })
  @IsOptional()
  recieverId: string;

  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message should not be empty' })
  message: string;
}
