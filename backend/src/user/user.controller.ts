/* eslint-disable */
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('/login/google')
  signInWithGoogle(@Body() createUserDto: CreateUserDto) {
    return this.userService.signInWithGoogle(createUserDto);
  }

  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 5) {
    return this.userService.getAllNonAdminUsers(Number(page), Number(limit));
  }
  @Post('/login')
  loginUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.loginUser(createUserDto);
  }

}