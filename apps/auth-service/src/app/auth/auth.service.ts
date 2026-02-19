import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, comparePassword, generateVerificationToken, addHours } from '@org/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UserProfile } from './auth.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  upworkId?: string;
}

export interface OAuthUserDto {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    emailVerified: boolean;
    createdAt: Date;
  };
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

export interface VerifyEmailDto {
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password && await comparePassword(password, user.password)) {
      const { password, ...result } = user;
      return result as UserProfile;
    }

    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return {
      user,
      accessToken,
      expiresIn,
    };
  }

  async adminLogin(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return {
      user,
      accessToken,
      expiresIn,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, password, firstName, lastName, upworkId } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if upworkId is already taken
    if (upworkId) {
      const existingUpworkUser = await this.prisma.user.findUnique({
        where: { upworkId },
      });

      if (existingUpworkUser) {
        throw new ConflictException('User with this Upwork ID already exists');
      }
    }

    const hashedPassword = await hashPassword(password);

    const verificationToken = generateVerificationToken();
    const verificationExpires = addHours(new Date(), 24); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        upworkId,
        isActive: true,
        emailVerified: false,
        verificationToken,
        verificationExpires,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email during registration:', error);
      return {
        message: 'Account created successfully, but we could not send the verification email. Please try resending it from your profile or login page.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      };
    }

    return {
      message: 'Account created successfully. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    };
  }

  async validateOAuthUser(oauthUser: OAuthUserDto): Promise<UserProfile> {
    const { provider, providerId, email, firstName, lastName, avatarUrl } = oauthUser;
    
    const providerField = provider === 'google' ? 'googleId' : provider === 'linkedin' ? 'linkedinId' : null;
    if (!providerField) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    let user = await this.prisma.user.findUnique({
      where: 
        providerField === 'googleId' 
          ? { googleId: providerId }
          : { linkedinId: providerId },
    });

    if (user) {
      const { password, ...result } = user;
      return result as UserProfile;
    }

    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: 
          providerField === 'googleId'
            ? { googleId: providerId }
            : { linkedinId: providerId },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
          ...(providerField === 'googleId' 
            ? { googleId: providerId }
            : { linkedinId: providerId }
          ),
          isActive: true,
          emailVerified: true,
        },
      });
    }

    const { password, ...result } = user;
    return result as UserProfile;
  }

  async generateTokenForUser(user: UserProfile): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { user, accessToken };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result as UserProfile;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = addHours(new Date(), 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Verification email sent' };
  }
}
