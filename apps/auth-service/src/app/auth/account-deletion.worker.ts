import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';

const MAX_ATTEMPTS = 8;
const POLL_MS = 15_000;

@Injectable()
export class AccountDeletionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AccountDeletionWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, POLL_MS);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.processNext();
    } catch (error) {
      this.logger.error('Account deletion worker tick failed', error);
    } finally {
      this.running = false;
    }
  }

  private async processNext() {
    const job = await this.prisma.accountDeletionOutbox.findFirst({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });

    if (!job) {
      return;
    }

    await this.prisma.accountDeletionOutbox.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    try {
      const deletionToken = this.authService.mintDeletionToken(
        job.userId,
        job.user.email,
        job.user.role
      );
      const authorization = `Bearer ${deletionToken}`;

      await this.authService.forwardDelete(
        `${this.configService.getProfileServiceUrl().replace(/\/$/, '')}/me`,
        authorization,
        'profile-service'
      );

      await this.authService.forwardDelete(
        `${this.configService.getProposalServiceUrl().replace(/\/$/, '')}/proposals/me`,
        authorization,
        'proposal-service'
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.accountDeletionOutbox.update({
          where: { id: job.id },
          data: { status: 'DONE', lastError: null },
        });
        await tx.user.delete({ where: { id: job.userId } });
      });

      this.logger.log(`Completed account deletion for user ${job.userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.accountDeletionOutbox.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          lastError: message.slice(0, 1000),
        },
      });
      this.logger.error(`Account deletion failed for user ${job.userId}: ${message}`);
    }
  }
}
