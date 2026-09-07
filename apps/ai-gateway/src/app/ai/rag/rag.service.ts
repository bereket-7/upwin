import { Injectable, Logger } from '@nestjs/common';
import { QdrantClientService } from './qdrant.client';
import { EmbeddingService } from './embedding.service';
import { RagContext, RagDocument } from './interfaces/rag.interface';
import { Profile } from '../interfaces/profile.interface';

const RAG_CONTENT_CHAR_CAP = 1200;

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

      const profileContext = this.buildProfileContext(profile);
      const queryText = this.embeddingService.prepareQueryText(
        jobDescription,
        profileContext
      );

      const queryVector = await this.embeddingService.generateEmbedding(queryText);

      const [proposalExamples, writingTemplates] = await Promise.all([
        this.retrieveProposalExamples(queryVector, profile),
        this.retrieveWritingTemplates(queryVector, profile),
      ]);

      const cappedExamples = proposalExamples.map((doc) => this.capDocument(doc));
      const cappedTemplates = writingTemplates.map((doc) => this.capDocument(doc));

      const ragContext: RagContext = {
        proposalExamples: cappedExamples,
        writingTemplates: cappedTemplates,
        totalRetrieved: cappedExamples.length + cappedTemplates.length,
      };

      const topScore = [...cappedExamples, ...cappedTemplates]
        .map((d) => d.score ?? 0)
        .sort((a, b) => b - a)[0];

      this.logger.log(
        `RAG retrieval complete: hitCount=${ragContext.totalRetrieved}, topScore=${topScore ?? 'n/a'}, examples=${cappedExamples.length}, templates=${cappedTemplates.length}`
      );

      return ragContext;
    } catch (error) {
      this.logger.error('Error in RAG retrieval:', error);

      return {
        proposalExamples: [],
        writingTemplates: [],
        totalRetrieved: 0,
      };
    }
  }

  private resolveTone(profile: Profile): string {
    const tonePreference = profile.preferences?.find((p) => p.category === 'TONE');
    return tonePreference?.value || profile.tone || 'professional';
  }

  private async retrieveProposalExamples(
    queryVector: number[],
    profile: Profile
  ): Promise<RagDocument[]> {
    try {
      const filters = {
        tone: this.resolveTone(profile),
      };

      return await this.qdrantClient.searchProposalExamples(
        queryVector,
        3,
        filters
      );
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
        tone: this.resolveTone(profile),
      };

      return await this.qdrantClient.searchWritingTemplates(
        queryVector,
        2,
        filters
      );
    } catch (error) {
      this.logger.error('Error retrieving writing templates:', error);
      return [];
    }
  }

  private capDocument(doc: RagDocument): RagDocument {
    if (!doc.content || doc.content.length <= RAG_CONTENT_CHAR_CAP) {
      return doc;
    }
    return {
      ...doc,
      content: `${doc.content.slice(0, RAG_CONTENT_CHAR_CAP)}…`,
    };
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

    if (ragContext.proposalExamples.length > 0) {
      sections.push('REFERENCE EXAMPLES (for inspiration only):');
      ragContext.proposalExamples.forEach((example, index) => {
        sections.push(`\nExample ${index + 1}:`);
        sections.push(example.content);
      });
    }

    if (ragContext.writingTemplates.length > 0) {
      sections.push('\n\nWRITING TEMPLATES (structural guidance):');
      ragContext.writingTemplates.forEach((template) => {
        const section = template.metadata.section || 'general';
        sections.push(`\n${section.toUpperCase()} Template:`);
        sections.push(template.content);
      });
    }

    return sections.join('\n');
  }
}
