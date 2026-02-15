import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createAuthDto: CreateUserDto) {
    const { username, email, userid, password, role } = createAuthDto;

    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });

    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingEmail) {
      throw new HttpException({ message: 'Email already in use' }, 400);
    }

    if (existingUsername) {
      throw new HttpException({ message: 'Username already in use' }, 400);
    }

    const newUser = this.userRepository.create({
      userid,
      username,
      email,
      password,
      role: role || 'user',
      isOnline: false,
    });

    await this.userRepository.save(newUser);

    return newUser;
  }

  async loginUser(createAuthDto: CreateUserDto) {
    const { email, password } = createAuthDto;

    const existingUser = await this.userRepository.findOne({
      where: { email, password },
    });

    if (!existingUser) {
      throw new HttpException('Email or password is incorrect', 404);
    }

    // if (existingUser.isBanned) {
    //   throw new HttpException('User is banned. Contact admin.', 403);
    // }

    return existingUser;
  }

  async signInWithGoogle(userGoogleDto: CreateUserDto) {
    const { email, userid, password, role } = userGoogleDto;
    let user = await this.userRepository.findOne({
      where: { email },
    });

    // if (user && user.isBanned) {
    //   throw new HttpException('User is banned. Contact admin.', 403);
    // }

    if (!user) {
      user = this.userRepository.create({
        email,
        userid,
        username: userGoogleDto.username,
        password,
        role: role || 'user',
        isOnline: false,
      });

      await this.userRepository.save(user);
    }
    return user;
  }
  async updateProfile(
    userid: string,
    bio?: string,
    file?: Express.Multer.File,
  ) {
    const user = await this.userRepository.findOne({
      where: { userid },
    });

    if (!user) throw new HttpException('User not found', 404);

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (file) {
      user.profilePic = file.filename;
    }

    await this.userRepository.save(user);

    return user;
  }

  async getAllNonAdminUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: {
        role: Not('admin'),
      },
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: users,
      total,
    };
  }

  async findByUserId(userid: string) {
    return this.userRepository.findOne({ where: { userid } });
  }
}
