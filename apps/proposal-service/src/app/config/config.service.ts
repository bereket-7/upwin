import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {
    this.validateConfig();
  }

  private validateConfig() {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
    
    for (const key of required) {
      if (!this.configService.get(key)) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL')!;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get port(): number {
    return this.configService.get<number>('PORT') || 3010;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  get allowedOrigins(): string[] {
    const origins = this.configService.get<string>('ALLOWED_ORIGINS');
    return origins ? origins.split(',') : ['http://localhost:3000'];
  }

  get aiGatewayUrl(): string {
    return this.configService.get<string>('AI_GATEWAY_URL') || 'http://localhost:3007/api';
  }

  get profileServiceUrl(): string {
    return this.configService.get<string>('PROFILE_SERVICE_URL') || 'http://localhost:3009/api';
  }
}
