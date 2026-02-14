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
      'CALLBACK_URL',
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

    // Optional vars with defaults
    config['API_URL'] = process.env.API_URL || 'http://localhost:3008/api';

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

  getApiUrl(): string {
    return this.get('API_URL');
  }

  getSmtpHost(): string {
    return process.env.SMTP_HOST || 'localhost';
  }

  getSmtpPort(): number {
    return parseInt(process.env.SMTP_PORT || '587', 10);
  }

  getSmtpUser(): string {
    return process.env.SMTP_USER || '';
  }

  getSmtpPass(): string {
    return process.env.SMTP_PASS || '';
  }

  getSmtpFrom(): string {
    const fromName = process.env.SMTP_FROM_NAME;
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    
    if (fromName && fromEmail) {
      return `"${fromName}" <${fromEmail}>`;
    }
    
    return process.env.SMTP_FROM || '"Upwin Support" <noreply@upwin.com>';
  }

  getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  validateCallbackUrl(url: string): boolean {
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      this.getCallbackUrl()
        .replace(/^https?:\/\//, '')
        .split('/')[0],
    ];

    try {
      const parsedUrl = new URL(url);
      return allowedDomains.some(
        (domain) =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }
}
