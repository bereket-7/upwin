import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  Res
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Res() res: Response) {
    const authResponse = await this.authService.generateTokenForUser(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.CALLBACK_URL}/auth/success?token=${authResponse.accessToken}`);
  }

  // LinkedIn OAuth routes
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {
    // Initiates LinkedIn OAuth flow
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Request() req, @Res() res: Response) {
    const authResponse = await this.authService.generateTokenForUser(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.CALLBACK_URL}/auth/success?token=${authResponse.accessToken}`);
  }
}
