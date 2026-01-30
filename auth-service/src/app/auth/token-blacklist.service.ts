import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Set<string>();

  blacklistToken(token: string): void {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded?.exp) {
        this.blacklistedTokens.add(token);
        this.scheduleTokenCleanup(token, decoded.exp * 1000);
      }
    } catch {
      // Invalid token, ignore
    }
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  private scheduleTokenCleanup(token: string, expirationTime: number): void {
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.blacklistedTokens.delete(token);
      }, timeUntilExpiry);
    }
  }

  constructor(private jwtService: JwtService) {}
}