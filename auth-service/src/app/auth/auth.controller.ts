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
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
import { ConfigService } from '../config/config.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
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
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req): Promise<any> {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Res() res: Response) {
    const authResponse = await this.authService.generateTokenForUser(req.user);
    const redirectUrl = `${this.configService.getCallbackUrl()}/auth/success`;
    
    if (!this.configService.validateCallbackUrl(redirectUrl)) {
      throw new BadRequestException('Invalid callback URL');
    }
    
    res.redirect(`${redirectUrl}?token=${authResponse.accessToken}`);
  }

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Request() req, @Res() res: Response) {
    const authResponse = await this.authService.generateTokenForUser(req.user);
    const redirectUrl = `${this.configService.getCallbackUrl()}/auth/success`;
    
    if (!this.configService.validateCallbackUrl(redirectUrl)) {
      throw new BadRequestException('Invalid callback URL');
    }
    
    res.redirect(`${redirectUrl}?token=${authResponse.accessToken}`);
  }
}
