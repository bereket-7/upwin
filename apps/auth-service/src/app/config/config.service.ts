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
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'CALLBACK_URL'
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
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return config;
  }

  get(key: string): string {
    return this.config[key];
  }

  getJwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  getDatabaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  getGoogleClientId(): string {
    return this.get('GOOGLE_CLIENT_ID');
  }

  getGoogleClientSecret(): string {
    return this.get('GOOGLE_CLIENT_SECRET');
  }

  getLinkedInClientId(): string {
    return this.get('LINKEDIN_CLIENT_ID');
  }

  getLinkedInClientSecret(): string {
    return this.get('LINKEDIN_CLIENT_SECRET');
  }

  getCallbackUrl(): string {
    return this.get('CALLBACK_URL');
  }

  validateCallbackUrl(url: string): boolean {
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      this.getCallbackUrl().replace(/^https?:\/\//, '').split('/')[0]
    ];
    
    try {
      const parsedUrl = new URL(url);
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }
}