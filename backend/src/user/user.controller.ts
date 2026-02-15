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
import { UseInterceptors, UploadedFile } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UpdateUserDto } from './dto/update-user.dto';
import { multerConfig } from 'src/database/multerConfiguration/multerConfig';

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

@Patch('profile/:userid')
@UseInterceptors(FileInterceptor('profilePic', multerConfig))
updateProfile(
  @Param('userid') userid: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() body: UpdateUserDto,
) {
   console.log("ROUTE HIT");
  console.log("FILE:", file);
  console.log("BODY:", body);
  return this.userService.updateProfile(userid, body.bio, file);
}
@Get('me/:userid')
getMe(@Param('userid') userid: string) {
  return this.userService.findByUserId(userid);
}

}
