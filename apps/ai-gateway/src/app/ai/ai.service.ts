import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProfileClient } from './http/profile.client';
import { PromptBuilder } from './prompt.builder';
import { GeminiConfig } from './config/gemini.config';
import { RagService } from './rag/rag.service';
import { GenerateProposalDto, ProposalResponseDto } from './dto/generate-proposal.dto';
import { ProposalClientService } from '../proposal-client/proposal-client.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly promptBuilder: PromptBuilder,
    private readonly geminiConfig: GeminiConfig,
    private readonly ragService: RagService,
    private readonly proposalClient: ProposalClientService,
  ) {}

  async generateProposal(dto: GenerateProposalDto, authorization: string): Promise<ProposalResponseDto> {
    const { profileId, jobDescription, userId, jobId, jobUrl, jobTitle, jobSource } = dto;

    try {
      // Step 1: Fetch profile data from profile-service
      this.logger.log(`Starting proposal generation for profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId, authorization);

      // Step 2: Retrieve RAG context (Phase 2)
      this.logger.log('Retrieving RAG context from Qdrant');
      const ragContext = await this.ragService.retrieveContext(jobDescription, profile);
      
      if (ragContext.totalRetrieved > 0) {
        this.logger.log(
          `RAG context retrieved: ${ragContext.proposalExamples.length} examples, ${ragContext.writingTemplates.length} templates`
        );
      } else {
        this.logger.warn('No RAG context retrieved, proceeding with profile data only');
      }

      // Step 3: Build structured prompt with RAG context
      this.logger.log('Building prompt with RAG context');
      const { system, user } = this.promptBuilder.buildPrompt(profile, jobDescription, ragContext);

      // Step 4: Call Gemini 2.5 Flash API
      this.logger.log("Calling Gemini 2.5 Flash API");
      const model = this.geminiConfig.getModel();

      // Combine system and user prompts for Gemini
      const fullPrompt = `${system}\n\n${user}`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const proposal = response.text();

      if (!proposal || proposal.trim().length === 0) {
        throw new HttpException(
          'Gemini API returned empty response',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(
        `Successfully generated proposal (${proposal.length} characters) with RAG enhancement`
      );

      // Step 5: Auto-save to proposal-service (non-blocking)
      this.saveProposalAsync(
        userId,
        profileId,
        jobId,
        jobSource || 'upwork',
        jobUrl,
        jobTitle,
        jobDescription,
        proposal.trim(),
        {
          tone: profile.tone,
          style: profile.writingStyle,
          ragUsed: ragContext.totalRetrieved > 0,
          streamingUsed: false,
          aiModel: 'gemini-2.5-flash',
        },
        authorization,
      );

      // Step 6: Return generated proposal immediately
      return {
        proposal: proposal.trim(),
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof HttpException) {
        throw error;
      }

      // Log and handle Gemini API errors
      this.logger.error('Error generating proposal:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key')) {
        throw new HttpException(
          'Invalid or missing Gemini API key',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new HttpException(
          'Gemini API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      throw new HttpException(
        'Failed to generate proposal',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Save proposal asynchronously - does not block response
   */
  private saveProposalAsync(
    userId: string,
    profileId: string,
    jobId: string | undefined,
    jobSource: string,
    jobUrl: string | undefined,
    jobTitle: string | undefined,
    jobDescription: string,
    content: string,
    promptMeta: any,
    authorization: string,
  ): void {
    // Fire and forget - don't await
    this.proposalClient
      .saveProposal({
        userId,
        profileId,
        jobId,
        jobSource,
        jobUrl,
        jobTitle,
        jobDescription,
        content,
        promptMeta,
      }, authorization)
      .catch((error) => {
        // Already logged in ProposalClientService
        this.logger.warn('Proposal save failed but generation succeeded');
      });
  }
}
