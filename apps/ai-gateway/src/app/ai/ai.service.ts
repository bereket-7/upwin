import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProfileClient } from './http/profile.client';
import { PromptBuilder } from './prompt.builder';
import { GeminiConfig } from './config/gemini.config';
import { GenerateProposalDto, ProposalResponseDto } from './dto/generate-proposal.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly promptBuilder: PromptBuilder,
    private readonly geminiConfig: GeminiConfig,
  ) {}

  async generateProposal(dto: GenerateProposalDto): Promise<ProposalResponseDto> {
    const { profileId, jobDescription } = dto;

    try {
      // Step 1: Fetch profile data from profile-service
      this.logger.log(`Starting proposal generation for profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId);

      // Step 2: Build structured prompt
      this.logger.log('Building prompt from profile and job description');
      const { system, user } = this.promptBuilder.buildPrompt(profile, jobDescription);

      // Step 3: Call Gemini 1.5 API
      this.logger.log('Calling Gemini 1.5 API');
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

      this.logger.log(`Successfully generated proposal (${proposal.length} characters)`);

      // Step 4: Return generated proposal
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
}
