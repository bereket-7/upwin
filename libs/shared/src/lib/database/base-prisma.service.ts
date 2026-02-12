import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export interface PrismaServiceConfig {
  databaseUrl: string;
  enableLogging?: boolean;
}

/**
 * Minimal interface describing the Prisma client methods this base
 * service relies on. This avoids a hard dependency on the generated
 * `@prisma/client` types, which may live in app-specific output paths.
 */
interface PrismaLikeClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

/**
 * Base Prisma service that handles connection pooling and lifecycle management.
 * Services should extend this class with their specific generated Prisma client.
 * 
 * @example
 * ```typescript
 * import { PrismaClient } from '../generated/prisma/client';
 * 
 * @Injectable()
 * export class AuthPrismaService extends BasePrismaService<PrismaClient> {
 *   constructor(configService: ConfigService) {
 *     super({
 *       databaseUrl: configService.getDatabaseUrl(),
 *       enableLogging: true
 *     });
 *   }
 * 
 *   protected createClient(adapter: PrismaPg): PrismaClient {
 *     return new PrismaClient({ adapter }) as PrismaClient;
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BasePrismaService<T extends PrismaLikeClient>
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(this.constructor.name);
  protected client: T;
  private pool: Pool;

  constructor(protected readonly config: PrismaServiceConfig) {
    this.pool = new Pool({ connectionString: config.databaseUrl });
    const adapter = new PrismaPg(this.pool);
    // Cast adapter to any to avoid cross-project PrismaPg type conflicts
    this.client = this.createClient(adapter as any);
  }

  /**
   * Factory method to create the specific Prisma client instance.
   * Must be implemented by the extending service.
   *
   * Note: we intentionally type the adapter as any here to avoid
   * PrismaPg private field incompatibilities across different
   * node_modules locations in workspaces.
   */
  protected abstract createClient(adapter: any): T;

  /**
   * Get the Prisma client instance.
   * Use this to access all Prisma operations.
   */
  getClient(): T {
    return this.client;
  }

  async onModuleInit() {
    try {
      await this.client.$connect();
      if (this.config.enableLogging) {
        this.logger.log('Database connection established');
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.$disconnect();
      await this.pool.end();
      if (this.config.enableLogging) {
        this.logger.log('Database connection closed');
      }
    } catch (error) {
      this.logger.error('Error during database disconnection', error);
    }
  }

  /**
   * Enable shutdown hooks for graceful application termination.
   * Call this in your main.ts or app module.
   */
  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
