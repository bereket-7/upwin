import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ProfileClient } from '../http/profile.client';
import { PromptBuilder } from '../prompt.builder';
import { GeminiConfig } from '../config/gemini.config';
import { RagService } from '../rag/rag.service';
import { StreamProposalDto } from '../dto/stream-proposal.dto';
import { Profile } from '../interfaces/profile.interface';

@Injectable()
export class AiStreamingService {
  private readonly logger = new Logger(AiStreamingService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly promptBuilder: PromptBuilder,
    private readonly geminiConfig: GeminiConfig,
    private readonly ragService: RagService,
  ) {}

  async streamProposal(dto: StreamProposalDto, response: Response): Promise<void> {
    const { profileId, jobDescription, tone, style } = dto;

    try {
      // Step 1: Fetch profile data
      this.logger.log(`Starting streaming proposal for profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId);

      // Apply overrides if provided
      const enhancedProfile = this.applyOverrides(profile, tone, style);

      // Step 2: Retrieve RAG context
      this.logger.log('Retrieving RAG context');
      const ragContext = await this.ragService.retrieveContext(jobDescription, enhancedProfile);

      if (ragContext.totalRetrieved > 0) {
        this.logger.log(
          `RAG context: ${ragContext.proposalExamples.length} examples, ${ragContext.writingTemplates.length} templates`
        );
      }

      // Step 3: Build prompt
      this.logger.log('Building streaming prompt');
      const { system, user } = this.promptBuilder.buildPrompt(
        enhancedProfile,
        jobDescription,
        ragContext
      );

      const fullPrompt = `${system}\n\n${user}`;

      // Step 4: Stream from Gemini
      this.logger.log('Starting Gemini streaming');
      await this.streamFromGemini(fullPrompt, response);

      this.logger.log('Streaming completed successfully');
    } catch (error) {
      this.logger.error('Error in streaming proposal:', error);
      this.sendError(response, error);
    }
  }

  private async streamFromGemini(prompt: string, response: Response): Promise<void> {
    try {
      const model = this.geminiConfig.getModel();

      // Generate content with streaming
      const result = await model.generateContentStream(prompt);

      // Stream chunks to client
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        if (chunkText) {
          // Send SSE message
          response.write(`data: ${chunkText}\n\n`);
        }
      }

      // Send completion event
      response.write(`event: done\n`);
      response.write(`data: [DONE]\n\n`);
      response.end();
    } catch (error) {
      this.logger.error('Error streaming from Gemini:', error);
      throw error;
    }
  }

  private applyOverrides(profile: Profile, tone?: string, style?: string): Profile {
    return {
      ...profile,
      tone: tone || profile.tone,
      writingStyle: style || profile.writingStyle,
    };
  }

  private sendError(response: Response, error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      response.write(`event: error\n`);
      response.write(`data: ${errorMessage}\n\n`);
      response.end();
    } catch (writeError) {
      this.logger.error('Failed to send error to client:', writeError);
      response.end();
    }
  }

  sendStreamHeaders(response: Response): void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    response.flushHeaders();
  }
}
