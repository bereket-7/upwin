import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly config: Record<string, string>;

  constructor() {
    this.config = {
      DATABASE_URL: process.env.PROFILE_DATABASE_URL || '',
      JWT_SECRET: process.env.JWT_SECRET || '',
      PORT: process.env.PROFILE_SERVICE_PORT || '3009',
    };
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
}
