import { Injectable } from '@nestjs/common';

@Injectable()
export class SharedConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }

  getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  // JWT Configuration
  get jwtSecret(): string {
    return this.getOrThrow('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.get('JWT_EXPIRY') || this.get('JWT_EXPIRES_IN') || '15m';
  }

  // Database Configuration
  get databaseUrl(): string {
    return this.getOrThrow('DATABASE_URL');
  }

  // Service Configuration
  get port(): number {
    return parseInt(this.get('PORT') || '3000', 10);
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // CORS Configuration — never use '*' with credentials
  get allowedOrigins(): string[] {
    const origins = this.get('ALLOWED_ORIGINS');
    if (!origins || origins.trim() === '*') {
      return ['http://localhost:3000'];
    }
    return origins.split(',').map((o) => o.trim()).filter(Boolean);
  }
}
