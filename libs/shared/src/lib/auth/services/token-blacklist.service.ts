import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface TokenBlacklistConfig {
  enableLogging?: boolean;
  cleanupInterval?: number; // in milliseconds
}

/**
 * Service to manage blacklisted JWT tokens (for logout functionality).
 * Tokens are automatically removed from the blacklist after expiration.
 * 
 * Note: This is an in-memory implementation. For production with multiple instances,
 * consider using Redis or a database-backed implementation.
 * 
 * @example
 * ```typescript
 * // In your auth service
 * async logout(token: string) {
 *   this.tokenBlacklistService.blacklistToken(token);
 *   return { message: 'Logged out successfully' };
 * }
 * ```
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private blacklistedTokens = new Set<string>();
  private cleanupTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: TokenBlacklistConfig = {}
  ) {}

  /**
   * Add a token to the blacklist.
   * The token will be automatically removed after it expires.
   */
  blacklistToken(token: string): void {
    try {
      const decoded = this.jwtService.decode(token) as any;
      
      if (!decoded?.exp) {
        if (this.config.enableLogging) {
          this.logger.warn('Token does not have expiration, cannot blacklist');
        }
        return;
      }

      this.blacklistedTokens.add(token);
      this.scheduleTokenCleanup(token, decoded.exp * 1000);

      if (this.config.enableLogging) {
        this.logger.log(`Token blacklisted, expires at ${new Date(decoded.exp * 1000).toISOString()}`);
      }
    } catch (error) {
      if (this.config.enableLogging) {
        this.logger.error('Failed to blacklist token', error);
      }
    }
  }

  /**
   * Check if a token is blacklisted.
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove a token from the blacklist manually.
   */
  removeToken(token: string): void {
    this.blacklistedTokens.delete(token);
    
    const timer = this.cleanupTimers.get(token);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(token);
    }
  }

  /**
   * Get the number of blacklisted tokens.
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Clear all blacklisted tokens (use with caution).
   */
  clearAll(): void {
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();
    this.blacklistedTokens.clear();
    
    if (this.config.enableLogging) {
      this.logger.log('All blacklisted tokens cleared');
    }
  }

  /**
   * Schedule automatic removal of token after expiration.
   */
  private scheduleTokenCleanup(token: string, expirationTime: number): void {
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;

    if (timeUntilExpiry <= 0) {
      // Token already expired, remove immediately
      this.blacklistedTokens.delete(token);
      return;
    }

    const timer = setTimeout(() => {
      this.blacklistedTokens.delete(token);
      this.cleanupTimers.delete(token);
      
      if (this.config.enableLogging) {
        this.logger.log('Expired token removed from blacklist');
      }
    }, timeUntilExpiry);

    this.cleanupTimers.set(token, timer);
  }
}
