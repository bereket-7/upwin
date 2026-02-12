import { Injectable, Logger } from '@nestjs/common';
import { QdrantClientService } from './qdrant.client';
import { EmbeddingService } from './embedding.service';
import { RagContext, RagDocument } from './interfaces/rag.interface';
import { Profile } from '../interfaces/profile.interface';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly qdrantClient: QdrantClientService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async retrieveContext(
    jobDescription: string,
    profile: Profile
  ): Promise<RagContext> {
    try {
      this.logger.log('Starting RAG retrieval');

      // Prepare query text for embedding
      const profileContext = this.buildProfileContext(profile);
      const queryText = this.embeddingService.prepareQueryText(
        jobDescription,
        profileContext
      );

      // Generate embedding for the query
      const queryVector = await this.embeddingService.generateEmbedding(queryText);

      // Retrieve proposal examples and writing templates in parallel
      const [proposalExamples, writingTemplates] = await Promise.all([
        this.retrieveProposalExamples(queryVector, profile),
        this.retrieveWritingTemplates(queryVector, profile),
      ]);

      const ragContext: RagContext = {
        proposalExamples,
        writingTemplates,
        totalRetrieved: proposalExamples.length + writingTemplates.length,
      };

      this.logger.log(
        `RAG retrieval complete: ${proposalExamples.length} examples, ${writingTemplates.length} templates`
      );

      return ragContext;
    } catch (error) {
      this.logger.error('Error in RAG retrieval:', error);
      
      // Return empty context on error (graceful degradation)
      return {
        proposalExamples: [],
        writingTemplates: [],
        totalRetrieved: 0,
      };
    }
  }

  private async retrieveProposalExamples(
    queryVector: number[],
    profile: Profile
  ): Promise<RagDocument[]> {
    try {
      // Extract filters from profile
      const filters = {
        tone: profile.tone,
        // Add more filters based on job analysis if needed
      };

      const examples = await this.qdrantClient.searchProposalExamples(
        queryVector,
        3, // Top 3 examples
        filters
      );

      return examples;
    } catch (error) {
      this.logger.error('Error retrieving proposal examples:', error);
      return [];
    }
  }

  private async retrieveWritingTemplates(
    queryVector: number[],
    profile: Profile
  ): Promise<RagDocument[]> {
    try {
      const filters = {
        tone: profile.tone,
      };

      const templates = await this.qdrantClient.searchWritingTemplates(
        queryVector,
        2, // Top 2 templates
        filters
      );

      return templates;
    } catch (error) {
      this.logger.error('Error retrieving writing templates:', error);
      return [];
    }
  }

  private buildProfileContext(profile: Profile): string {
    const parts: string[] = [];

    if (profile.title) {
      parts.push(profile.title);
    }

    if (profile.skills && profile.skills.length > 0) {
      parts.push(profile.skills.slice(0, 5).join(', '));
    }

    if (profile.experienceYrs) {
      parts.push(`${profile.experienceYrs} years experience`);
    }

    return parts.join(' | ');
  }

  /**
   * Format RAG context for prompt injection
   */
  formatRagContext(ragContext: RagContext): string {
    if (ragContext.totalRetrieved === 0) {
      return '';
    }

    const sections: string[] = [];

    // Format proposal examples
    if (ragContext.proposalExamples.length > 0) {
      sections.push('REFERENCE EXAMPLES (for inspiration only):');
      ragContext.proposalExamples.forEach((example, index) => {
        sections.push(`\nExample ${index + 1}:`);
        sections.push(example.content);
      });
    }

    // Format writing templates
    if (ragContext.writingTemplates.length > 0) {
      sections.push('\n\nWRITING TEMPLATES (structural guidance):');
      ragContext.writingTemplates.forEach((template, index) => {
        const section = template.metadata.section || 'general';
        sections.push(`\n${section.toUpperCase()} Template:`);
        sections.push(template.content);
      });
    }

    return sections.join('\n');
  }
}
