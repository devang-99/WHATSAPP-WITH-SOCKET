import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'user id must be a string' })
  @IsOptional()
  userid: string;

  @IsEmail()
  email: string;

  @IsString({ message: 'username must be a string' })
  @IsOptional()
  username: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password should not be empty' })
  password: string;

  @IsBoolean()
  @IsOptional()
  isOnline: boolean;

  @IsString({ message: 'role must be a string' })
  @IsOptional()
  role: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  profilePic: string;
}
