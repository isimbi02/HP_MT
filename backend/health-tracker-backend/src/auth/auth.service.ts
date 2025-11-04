import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.PATIENT, // New accounts are created as patients
    });

    await this.usersRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async loginAsGuest() {
    // Find or create a default guest user
    let guestUser = await this.usersRepository.findOne({
      where: { 
        email: 'guest@healthtracker.com',
        role: UserRole.GUEST,
      },
    });

    if (!guestUser) {
      // Create a temporary guest user if one doesn't exist
      // This is a fallback - normally guests should be seeded
      // Use a hashed password for guests (they won't need to login with it)
      const hashedPassword = await bcrypt.hash('guest', 10);
      guestUser = this.usersRepository.create({
        email: `guest-${Date.now()}@healthtracker.com`,
        password: hashedPassword,
        firstName: 'Guest',
        lastName: 'User',
        role: UserRole.GUEST,
        isActive: true,
      });
      await this.usersRepository.save(guestUser);
    }

    if (!guestUser.isActive) {
      throw new UnauthorizedException('Guest access is currently unavailable');
    }

    const payload = { sub: guestUser.id, email: guestUser.email, role: guestUser.role };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = guestUser;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }
}