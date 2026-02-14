import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ProfileClient } from '../http/profile.client';
import { PromptBuilder } from '../prompt.builder';
import { GeminiConfig } from '../config/gemini.config';
import { RagService } from '../rag/rag.service';
import { StreamProposalDto } from '../dto/stream-proposal.dto';
import { Profile } from '../interfaces/profile.interface';
import { ProposalClientService } from '../../proposal-client/proposal-client.service';

@Injectable()
export class AiStreamingService {
  private readonly logger = new Logger(AiStreamingService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly promptBuilder: PromptBuilder,
    private readonly geminiConfig: GeminiConfig,
    private readonly ragService: RagService,
    private readonly proposalClient: ProposalClientService,
  ) {}

  async streamProposal(dto: StreamProposalDto, response: Response): Promise<void> {
    const { profileId, jobDescription, tone, style, userId, jobUrl, jobTitle, jobSource } = dto;

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

      // Step 4: Stream from Gemini and accumulate content
      this.logger.log('Starting Gemini streaming');
      const fullContent = await this.streamFromGemini(fullPrompt, response);

      // Step 5: Save to proposal-service after streaming completes
      this.logger.log('Streaming completed, saving proposal');
      await this.saveStreamedProposal(
        userId,
        profileId,
        jobSource || 'upwork',
        jobUrl,
        jobTitle,
        jobDescription,
        fullContent,
        {
          tone: enhancedProfile.tone,
          style: enhancedProfile.writingStyle,
          ragUsed: ragContext.totalRetrieved > 0,
          streamingUsed: true,
          aiModel: 'gemini-1.5-pro',
        },
        response,
      );

      this.logger.log('Streaming and save completed successfully');
    } catch (error) {
      this.logger.error('Error in streaming proposal:', error);
      this.sendError(response, error);
    }
  }

  private async streamFromGemini(prompt: string, response: Response): Promise<string> {
    try {
      const model = this.geminiConfig.getModel();
      let fullContent = '';

      // Generate content with streaming
      const result = await model.generateContentStream(prompt);

      // Stream chunks to client and accumulate
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        if (chunkText) {
          fullContent += chunkText;
          // Send SSE message
          response.write(`data: ${chunkText}\n\n`);
        }
      }

      // Send completion event
      response.write(`event: done\n`);
      response.write(`data: [DONE]\n\n`);

      return fullContent;
    } catch (error) {
      this.logger.error('Error streaming from Gemini:', error);
      throw error;
    }
  }

  /**
   * Save streamed proposal to proposal-service
   * Sends save_success or save_error events
   */
  private async saveStreamedProposal(
    userId: string,
    profileId: string,
    jobSource: string,
    jobUrl: string | undefined,
    jobTitle: string | undefined,
    jobDescription: string,
    content: string,
    promptMeta: any,
    response: Response,
  ): Promise<void> {
    try {
      const result = await this.proposalClient.saveProposal({
        userId,
        profileId,
        jobSource,
        jobUrl,
        jobTitle,
        jobDescription,
        content,
        promptMeta,
      });

      if (result) {
        // Send success event with proposal ID
        response.write(`event: saved\n`);
        response.write(`data: ${JSON.stringify({ proposalId: result.id, version: result.currentVersion })}\n\n`);
        this.logger.log(`Proposal saved: ${result.id}`);
      } else {
        // Save failed but don't break the stream
        response.write(`event: save_error\n`);
        response.write(`data: Failed to save proposal\n\n`);
        this.logger.warn('Proposal save failed');
      }
    } catch (error) {
      // Send error event but don't throw
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      response.write(`event: save_error\n`);
      response.write(`data: ${errorMessage}\n\n`);
      this.logger.error('Error saving streamed proposal:', error);
    } finally {
      // Always end the response
      response.end();
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
