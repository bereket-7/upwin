import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthCodeService {
  private readonly logger = new Logger(AuthCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateAuthCode(userId: string): Promise<string> {
    const code = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.authCode.create({
      data: { code, userId, expiresAt },
    });

    await this.cleanupExpiredCodes();
    return code;
  }

  async exchangeCodeForToken(code: string): Promise<string | null> {
    const authCode = await this.prisma.authCode.findUnique({ where: { code } });

    if (!authCode) {
      return null;
    }

    await this.prisma.authCode.delete({ where: { code } }).catch(() => undefined);

    if (authCode.expiresAt.getTime() < Date.now()) {
      return null;
    }

    return authCode.userId;
  }

  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.prisma.authCode.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    if (result.count > 0) {
      this.logger.debug(`Cleaned ${result.count} expired auth codes`);
    }
    return result.count;
  }
}
