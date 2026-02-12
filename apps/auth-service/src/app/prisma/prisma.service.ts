import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@org/shared';
import type { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PrismaService extends BasePrismaService<any> {
  constructor(configService: ConfigService) {
    super({
      databaseUrl: configService.getDatabaseUrl(),
      enableLogging: process.env.NODE_ENV !== 'production',
    });
  }

  protected createClient(adapter: PrismaPg): any {
    const { PrismaClient } = require('../../generated/prisma/client');
    return new PrismaClient({ adapter });
  }

  // Proxy Prisma models for easy access
  get user() {
    return this.client.user;
  }
}
