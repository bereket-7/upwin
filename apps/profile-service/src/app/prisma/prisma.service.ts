import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@org/shared';
import type { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PrismaService extends BasePrismaService<any> {
  constructor(configService: ConfigService) {
    super({
      databaseUrl: configService.getDatabaseUrl(),
      enableLogging: !configService.isProduction(),
    });
  }

  protected createClient(adapter: PrismaPg): any {
    const { PrismaClient } = require('../../generated/client');
    return new PrismaClient({ adapter });
  }

  // Proxy Prisma models for easy access
  get profile() {
    return this.client.profile;
  }

  get portfolioItem() {
    return this.client.portfolioItem;
  }

  get workHistoryItem() {
    return this.client.workHistoryItem;
  }
}
