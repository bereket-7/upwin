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
  Query,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
import { ConfigService } from '../config/config.service';
import { AuthCodeService } from './auth-code.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserProfile, AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly authCodeService: AuthCodeService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: AuthenticatedUser }): Promise<UserProfile> {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: AuthenticatedUser; headers: { authorization?: string } }): Promise<{ message: string }> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      this.tokenBlacklistService.blacklistToken(token);
    }
    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req: { user: UserProfile }, @Res() res: Response) {
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
  async linkedinCallback(@Request() req: { user: UserProfile }, @Res() res: Response) {
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
}
