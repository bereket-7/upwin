import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface AuthCode {
  code: string;
  userId: string;
  expiresAt: Date;
}

@Injectable()
export class AuthCodeService {
  private authCodes = new Map<string, AuthCode>();

  generateAuthCode(userId: string): string {
    const code = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    this.authCodes.set(code, {
      code,
      userId,
      expiresAt,
    });

    this.cleanupExpiredCodes();
    return code;
  }

  exchangeCodeForToken(code: string): string | null {
    const authCode = this.authCodes.get(code);
    
    if (!authCode || authCode.expiresAt < new Date()) {
      this.authCodes.delete(code);
      return null;
    }

    this.authCodes.delete(code);
    return authCode.userId;
  }

  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [code, authCode] of this.authCodes.entries()) {
      if (authCode.expiresAt < now) {
        this.authCodes.delete(code);
      }
    }
  }
}