import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(userId: string, accessToken: string, refreshToken: string) {
    const accessTokenExpiry = this.configService.getJwtExpiryInSeconds();
    const refreshTokenExpiry = this.getRefreshTokenExpiryInSeconds();

    const expiresAt = new Date(Date.now() + accessTokenExpiry * 1000);
    const refreshExpiresAt = new Date(Date.now() + refreshTokenExpiry * 1000);

    return this.prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
      },
    });
  }

  async findSessionByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  async deleteSession(refreshToken: string) {
    try {
      await this.prisma.session.delete({
        where: { refreshToken },
      });
    } catch (error) {
      this.logger.warn(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUserSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredSessions() {
    const deleted = await this.prisma.session.deleteMany({
      where: {
        refreshExpiresAt: {
          lt: new Date(),
        },
      },
    });
    
    if (deleted.count > 0) {
      this.logger.log(`Cleaned up ${deleted.count} expired sessions`);
    }
    
    return deleted.count;
  }

  private getRefreshTokenExpiryInSeconds(): number {
    const expiry = this.configService.getJwtRefreshExpiry();
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // default 7 days
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 604800;
    }
  }
}
