import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OAuthUserDto {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
        emailVerified: false,
      },
    });

    const { password: _, ...result } = user;
    
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: result,
      accessToken,
    };
  }

  async validateOAuthUser(oauthUser: OAuthUserDto): Promise<Omit<User, 'password'>> {
    const { provider, providerId, email, firstName, lastName, avatarUrl } = oauthUser;
    
    // Check if user exists by provider ID
    const providerField = provider === 'google' ? 'googleId' : 'linkedinId';
    let user = await this.prisma.user.findUnique({
      where: { [providerField]: providerId },
    });

    if (user) {
      const { password, ...result } = user;
      return result;
    }

    // Check if user exists by email
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Link OAuth account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { [providerField]: providerId },
      });
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
          provider,
          [providerField]: providerId,
          isActive: true,
          emailVerified: true, // OAuth emails are pre-verified
        },
      });
    }

    const { password, ...result } = user;
    return result;
  }

  async generateTokenForUser(user: Omit<User, 'password'>): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { user, accessToken };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }
}
