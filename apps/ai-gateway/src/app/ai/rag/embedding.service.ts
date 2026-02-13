import { Injectable, Logger } from '@nestjs/common';
import { GeminiConfig } from '../config/gemini.config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly geminiConfig: GeminiConfig) {}

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.log('Generating embedding for text');

      const model = this.geminiConfig.getModel();

      // Use Gemini's embedding model
      const result = await model.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error('Failed to generate embedding');
      }

      this.logger.log(`Generated embedding with ${result.embedding.values.length} dimensions`);

      return result.embedding.values;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      this.logger.log(`Generating embeddings for ${texts.length} texts`);

      const embeddings = await Promise.all(
        texts.map((text) => this.generateEmbedding(text))
      );

      return embeddings;
    } catch (error) {
      this.logger.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Prepare query text for embedding
   * Combines job description with context for better retrieval
   */
  prepareQueryText(jobDescription: string, profileContext?: string): string {
    let queryText = jobDescription;

    if (profileContext) {
      queryText = `${profileContext}\n\n${jobDescription}`;
    }

    // Truncate if too long (Gemini has token limits)
    const maxLength = 2000;
    if (queryText.length > maxLength) {
      queryText = queryText.substring(0, maxLength);
    }

    return queryText;
  }
}
