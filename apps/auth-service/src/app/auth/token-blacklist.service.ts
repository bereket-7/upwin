import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Revoke an access token by persisting its jti until expiry.
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as {
        jti?: string;
        exp?: number;
      } | null;

      if (!decoded?.jti || !decoded?.exp) {
        this.logger.warn('Access token missing jti/exp; cannot revoke');
        return;
      }

      await this.prisma.revokedAccessToken.upsert({
        where: { jti: decoded.jti },
        create: {
          jti: decoded.jti,
          expiresAt: new Date(decoded.exp * 1000),
        },
        update: {
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error) {
      this.logger.error('Failed to blacklist access token', error);
    }
  }

  async blacklistJti(jti: string, expiresAt: Date): Promise<void> {
    await this.prisma.revokedAccessToken.upsert({
      where: { jti },
      create: { jti, expiresAt },
      update: { expiresAt },
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode(token) as { jti?: string } | null;
      if (!decoded?.jti) {
        return false;
      }
      return this.isJtiRevoked(decoded.jti);
    } catch {
      return false;
    }
  }

  async isJtiRevoked(jti: string): Promise<boolean> {
    const row = await this.prisma.revokedAccessToken.findUnique({
      where: { jti },
    });
    if (!row) {
      return false;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      await this.prisma.revokedAccessToken.delete({ where: { jti } }).catch(() => undefined);
      return false;
    }
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.revokedAccessToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return result.count;
  }
}
