import { Injectable, Logger } from '@nestjs/common';
import { QdrantConfig } from './config/qdrant.config';
import { RagDocument } from './interfaces/rag.interface';

@Injectable()
export class QdrantClientService {
  private readonly logger = new Logger(QdrantClientService.name);

  constructor(private readonly qdrantConfig: QdrantConfig) {}

  async search(
    collectionName: string,
    queryVector: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<RagDocument[]> {
    try {
      const client = await this.qdrantConfig.getClient();

      this.logger.log(`Searching collection: ${collectionName}, topK: ${topK}`);

      const scoreThreshold = 0.55;
      const searchResult = await client.search(collectionName, {
        vector: queryVector,
        limit: topK,
        with_payload: true,
        filter: filter,
        score_threshold: scoreThreshold,
      });

      const documents: RagDocument[] = searchResult.map((result: any) => ({
        id: result.id.toString(),
        content: result.payload?.content as string || '',
        metadata: (result.payload?.metadata as Record<string, any>) || {},
        score: result.score,
      }));

      const topScore = documents[0]?.score;
      this.logger.log(
        `Retrieved ${documents.length} documents from ${collectionName} (hitCount=${documents.length}, topScore=${topScore ?? 'n/a'}, threshold=${scoreThreshold})`
      );

      return documents;
    } catch (error) {
      this.logger.error(`Error searching collection ${collectionName}:`, error);
      // Return empty array on error to allow graceful degradation
      return [];
    }
  }

  async searchProposalExamples(
    queryVector: number[],
    topK: number = 3,
    filters?: {
      jobType?: string;
      industry?: string;
      seniority?: string;
      tone?: string;
    }
  ): Promise<RagDocument[]> {
    const collectionName = this.qdrantConfig.getProposalExamplesCollection();

    // Build Qdrant filter if provided
    const filter = filters ? this.buildFilter(filters) : undefined;

    return this.search(collectionName, queryVector, topK, filter);
  }

  async searchWritingTemplates(
    queryVector: number[],
    topK: number = 2,
    filters?: {
      section?: string;
      tone?: string;
    }
  ): Promise<RagDocument[]> {
    const collectionName = this.qdrantConfig.getWritingTemplatesCollection();

    const filter = filters ? this.buildFilter(filters) : undefined;

    return this.search(collectionName, queryVector, topK, filter);
  }

  private buildFilter(filters: Record<string, any>): any {
    const must: any[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        must.push({
          key: `metadata.${key}`,
          match: { value },
        });
      }
    });

    return must.length > 0 ? { must } : undefined;
  }

  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const client = await this.qdrantConfig.getClient();
      const collections = await client.getCollections();
      return collections.collections.some((col: any) => col.name === collectionName);
    } catch (error) {
      this.logger.error(`Error checking collection ${collectionName}:`, error);
      return false;
    }
  }
}
