import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
  UnauthorizedException,
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AuthService } from './auth.service';
import type { LoginDto, RegisterDto, LoginResponse, RegisterResponse, AuthResponse, RefreshTokenResponse } from './auth.service';
import { ConfigService } from '../config/config.service';
import { AuthCodeService } from './auth-code.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import * as AuthTypes from './auth.types';
import { CurrentUser } from '@org/shared';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Patch, Delete } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly authCodeService: AuthCodeService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body('email') email: string,
    @Body('otp') otp: string
  ): Promise<{ message: string }> {
    if (!email || !otp) {
      throw new BadRequestException('Email and verification code (OTP) are required');
    }
    return this.authService.verifyEmail(email, otp);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendVerification(email);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body('email') email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendOtp(email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.adminLogin(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthTypes.AuthenticatedUser): Promise<AuthTypes.UserProfile> {
    return this.authService.getProfile(user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthTypes.AuthenticatedUser,
    @Body('refreshToken') refreshToken?: string,
  ): Promise<{ message: string }> {
    // Blacklist the access token
    const token = refreshToken; // You can extract from header if needed
    if (token) {
      this.tokenBlacklistService.blacklistToken(token);
    }
    
    // Delete session if refresh token provided
    if (refreshToken) {
      return this.authService.logout(refreshToken);
    }
    
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthTypes.AuthenticatedUser): Promise<{ message: string }> {
    return this.authService.logoutAll(user.userId);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req: { user: AuthTypes.UserProfile }, @Res() res: Response) {
    const authCode = this.authCodeService.generateAuthCode(req.user.id);
    const redirectUrl = `${this.configService.getCallbackUrl()}/auth/success`;
    
    if (!this.configService.validateCallbackUrl(redirectUrl)) {
      throw new BadRequestException('Invalid callback URL');
    }
    
    res.redirect(`${redirectUrl}?code=${authCode}`);
  }

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Request() req: { user: AuthTypes.UserProfile }, @Res() res: Response) {
    const authCode = this.authCodeService.generateAuthCode(req.user.id);
    const redirectUrl = `${this.configService.getCallbackUrl()}/auth/success`;
    
    if (!this.configService.validateCallbackUrl(redirectUrl)) {
      throw new BadRequestException('Invalid callback URL');
    }
    
    res.redirect(`${redirectUrl}?code=${authCode}`);
  }

  @Post('exchange')
  async exchangeCodeForToken(@Body('code') code: string): Promise<AuthResponse> {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    const userId = this.authCodeService.exchangeCodeForToken(code);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    const user = await this.authService.getProfile(userId);
    return this.authService.generateTokenForUser(user);
  }

  @Get('success')
  async success(@Query('code') code: string) {
    return {
      message: 'SSO Login Successful',
      authCode: code,
      instructions: 'You can now exchange this code for a JWT token using the /auth/exchange endpoint.'
    };
  }

  @Get('test-dashboard')
  async testDashboard(@Res() res: Response) {
    const htmlPath = join(__dirname, '..', '..', 'assets', 'templates', 'test-auth.html');
    const html = readFileSync(htmlPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Patch('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateAvatar(
    @CurrentUser() user: AuthTypes.AuthenticatedUser,
    @Body() dto: UpdateAvatarDto
  ): Promise<AuthTypes.UserProfile> {
    return this.authService.updateAvatar(user.userId, dto.avatarUrl);
  }

  @Delete('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(
    @CurrentUser() user: AuthTypes.AuthenticatedUser
  ): Promise<AuthTypes.UserProfile> {
    return this.authService.deleteAvatar(user.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthTypes.AuthenticatedUser,
    @Body() dto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.userId, dto.oldPassword, dto.newPassword);
  }
}
