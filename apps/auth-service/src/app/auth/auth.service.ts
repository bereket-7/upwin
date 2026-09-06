import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, BadGatewayException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, comparePassword, generateVerificationToken, addHours } from '@org/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '../config/config.service';
import { SessionService } from './session.service';
import { UserProfile, LoginUserDto } from './auth.types';
import { randomBytes } from 'crypto';

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
  user: LoginUserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: LoginUserDto;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerifyEmailDto {
  email: string;
  otp: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
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

    return this.generateAuthTokens(user);
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

    return this.generateAuthTokens(user);
  }

  private async generateAuthTokens(user: UserProfile): Promise<LoginResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    // Generate access token
    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    
    // Create session
    await this.sessionService.createSession(user.id, accessToken, refreshToken);
    
    // Get expiry time
    const expiresIn = this.configService.getJwtExpiryInSeconds();

    return {
      user: this.toLoginUserDto(user),
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Find session by refresh token
    const session = await this.sessionService.findSessionByRefreshToken(refreshToken);
    
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (session.refreshExpiresAt < new Date()) {
      await this.sessionService.deleteSession(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const user = session.user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    // Delete old session and create new one
    await this.sessionService.deleteSession(refreshToken);
    await this.sessionService.createSession(user.id, newAccessToken, newRefreshToken);

    const expiresIn = this.configService.getJwtExpiryInSeconds();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private toLoginUserDto(user: UserProfile): LoginUserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      upworkId: (user as any).upworkId || null,
      role: user.role,
      emailVerified: user.emailVerified,
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
    const refreshToken = this.generateRefreshToken();
    
    // Create session for OAuth users
    await this.sessionService.createSession(user.id, accessToken, refreshToken);
    
    return { 
      user: this.toLoginUserDto(user), 
      accessToken,
      refreshToken,
    };
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

  async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.verificationToken !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
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

  async resendOtp(email: string): Promise<{ message: string }> {
    return this.resendVerification(email);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    if (refreshToken) {
      await this.sessionService.deleteSession(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.sessionService.deleteUserSessions(userId);
    return { message: 'Logged out from all devices' };
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    const { password, ...result } = user;
    return result as UserProfile;
  }

  async deleteAvatar(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    const { password, ...result } = user;
    return result as UserProfile;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or password not set');
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Cascade account deletion: profile → proposals → auth user.
   * Aborts before deleting the auth user if a downstream purge fails.
   */
  async deleteAccount(userId: string, authorization: string): Promise<{ message: string }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    await this.forwardDelete(
      `${this.configService.getProfileServiceUrl().replace(/\/$/, '')}/me`,
      authorization,
      'profile-service'
    );

    await this.forwardDelete(
      `${this.configService.getProposalServiceUrl().replace(/\/$/, '')}/proposals/me`,
      authorization,
      'proposal-service'
    );

    await this.sessionService.deleteUserSessions(userId);
    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Deleted auth account for user ${userId}`);
    return { message: 'Account deleted successfully' };
  }

  private async forwardDelete(url: string, authorization: string, serviceName: string) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: authorization },
      });
    } catch (error) {
      this.logger.error(`Failed to reach ${serviceName} during account deletion`, error);
      throw new BadGatewayException(`Failed to purge data via ${serviceName}`);
    }

    if (!response.ok) {
      this.logger.error(`${serviceName} purge failed with status ${response.status}`);
      throw new BadGatewayException(`Failed to purge data via ${serviceName}`);
    }
  }
}
