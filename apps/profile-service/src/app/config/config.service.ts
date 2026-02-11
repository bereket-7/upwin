import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly config: Record<string, string>;

  constructor() {
    this.config = this.validateConfig();
  }

  private validateConfig(): Record<string, string> {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'PORT',
    ];

    const config: Record<string, string> = {};
    const missing: string[] = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        config[varName] = value;
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    return config;
  }

  get(key: string): string {
    return this.config[key];
  }

  getDatabaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  getJwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  getPort(): number {
    return parseInt(this.get('PORT'), 10);
  }

  getNodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS;
    return origins ? origins.split(',') : ['http://localhost:3000'];
  }
}
