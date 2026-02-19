import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class SessionCleanupService implements OnModuleInit {
  private readonly logger = new Logger(SessionCleanupService.name);
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly sessionService: SessionService) {}

  onModuleInit() {
    // Run cleanup every hour
    this.startCleanupSchedule();
  }

  private startCleanupSchedule() {
    // Run immediately on startup
    this.cleanupExpiredSessions();

    // Then run every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // 1 hour
  }

  private async cleanupExpiredSessions() {
    try {
      const count = await this.sessionService.cleanupExpiredSessions();
      if (count > 0) {
        this.logger.log(`Session cleanup completed: ${count} sessions removed`);
      }
    } catch (error) {
      this.logger.error('Session cleanup failed:', error);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
