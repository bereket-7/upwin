import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SessionService } from './session.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuthCodeService } from './auth-code.service';

@Injectable()
export class SessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionCleanupService.name);
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly sessionService: SessionService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly authCodeService: AuthCodeService,
  ) {}

  onModuleInit() {
    this.startCleanupSchedule();
  }

  private startCleanupSchedule() {
    void this.cleanupExpired();

    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpired();
    }, 60 * 60 * 1000);
  }

  private async cleanupExpired() {
    try {
      const sessions = await this.sessionService.cleanupExpiredSessions();
      const revoked = await this.tokenBlacklistService.cleanupExpired();
      const codes = await this.authCodeService.cleanupExpiredCodes();
      if (sessions > 0 || revoked > 0 || codes > 0) {
        this.logger.log(
          `Auth cleanup: sessions=${sessions}, revoked=${revoked}, authCodes=${codes}`
        );
      }
    } catch (error) {
      this.logger.error('Auth cleanup failed:', error);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
