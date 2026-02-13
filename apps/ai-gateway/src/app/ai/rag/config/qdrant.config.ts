import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QdrantConfig {
  private readonly logger = new Logger(QdrantConfig.name);
  private client: any;
  private readonly proposalExamplesCollection: string;
  private readonly writingTemplatesCollection: string;
  private clientPromise: Promise<any>;

  constructor(private configService: ConfigService) {
    const qdrantUrl = this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
    const qdrantApiKey = this.configService.get<string>('QDRANT_API_KEY');

    this.proposalExamplesCollection = 'proposal_examples';
    this.writingTemplatesCollection = 'writing_templates';

    // Dynamic import for ESM module
    this.clientPromise = this.initializeClient(qdrantUrl, qdrantApiKey);
    
    this.logger.log(`Qdrant client initializing: ${qdrantUrl}`);
  }

  private async initializeClient(url: string, apiKey?: string): Promise<any> {
    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      this.client = new QdrantClient({
        url,
        apiKey,
      });
      this.logger.log('Qdrant client initialized successfully');
      return this.client;
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant client:', error);
      throw error;
    }
  }

  async getClient(): Promise<any> {
    if (!this.client) {
      this.client = await this.clientPromise;
    }
    return this.client;
  }

  getProposalExamplesCollection(): string {
    return this.proposalExamplesCollection;
  }

  getWritingTemplatesCollection(): string {
    return this.writingTemplatesCollection;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.getCollections();
      return true;
    } catch (error) {
      this.logger.error('Qdrant health check failed:', error);
      return false;
    }
  }
}
