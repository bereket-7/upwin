import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantConfig } from './config/qdrant.config';

interface CollectionConfig {
  name: string;
  vectorSize: number;
  distance: 'Cosine' | 'Euclid' | 'Dot';
}

@Injectable()
export class QdrantInitializerService implements OnModuleInit {
  private readonly logger = new Logger(QdrantInitializerService.name);
  private readonly collections: CollectionConfig[] = [
    {
      name: 'proposal_examples',
      vectorSize: 3072,
      distance: 'Cosine',
    },
    {
      name: 'writing_templates',
      vectorSize: 3072,
      distance: 'Cosine',
    },
  ];

  constructor(private readonly qdrantConfig: QdrantConfig) {}

  /**
   * Initialize Qdrant collections on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing Qdrant collections...');
    await this.initializeCollections();
  }

  /**
   * Check and create collections if they don't exist
   */
  private async initializeCollections(): Promise<void> {
    try {
      const client = await this.qdrantConfig.getClient();

      for (const collection of this.collections) {
        try {
          // Check if collection exists
          const exists = await this.collectionExists(collection.name);

          if (exists) {
            this.logger.log(`✓ Collection '${collection.name}' already exists`);
            continue;
          }

          // Create collection
          this.logger.log(`Creating collection '${collection.name}'...`);
          await client.createCollection(collection.name, {
            vectors: {
              size: collection.vectorSize,
              distance: collection.distance,
            },
          });

          this.logger.log(
            `✓ Collection '${collection.name}' created successfully (size: ${collection.vectorSize}, distance: ${collection.distance})`,
          );
        } catch (error) {
          this.logger.error(
            `✗ Error initializing collection '${collection.name}':`,
            error instanceof Error ? error.message : error,
          );
          // Continue with next collection
        }
      }

      this.logger.log('Qdrant collections initialization complete');
    } catch (error) {
      this.logger.error(
        '✗ Failed to initialize Qdrant client:',
        error instanceof Error ? error.message : error,
      );
      // Don't throw - allow service to start even if Qdrant is unavailable
    }
  }

  /**
   * Check if a collection exists
   */
  private async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const client = await this.qdrantConfig.getClient();
      const collections = await client.getCollections();
      
      return collections.collections.some(
        (col: any) => col.name === collectionName,
      );
    } catch (error) {
      this.logger.error(
        `Error checking collection '${collectionName}':`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }

  /**
   * Manually trigger collection initialization (for testing/debugging)
   */
  async reinitialize(): Promise<void> {
    this.logger.log('Manual reinitialization triggered');
    await this.initializeCollections();
  }

  /**
   * Get collection info for debugging
   */
  async getCollectionInfo(collectionName: string): Promise<any> {
    try {
      const client = await this.qdrantConfig.getClient();
      const info = await client.getCollection(collectionName);
      return info;
    } catch (error) {
      this.logger.error(
        `Error getting collection info for '${collectionName}':`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  /**
   * Delete a collection (for testing/cleanup)
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      const client = await this.qdrantConfig.getClient();
      await client.deleteCollection(collectionName);
      this.logger.log(`Collection '${collectionName}' deleted`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting collection '${collectionName}':`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
}
