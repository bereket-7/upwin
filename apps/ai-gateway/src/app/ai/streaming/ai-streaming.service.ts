import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ProfileClient } from '../http/profile.client';
import { assertProfileOwnedByUser } from '../http/assert-profile-ownership';
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

  async streamProposal(
    userId: string,
    dto: StreamProposalDto,
    authorization: string,
    response: Response,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const { profileId, jobDescription, tone, style, jobId, jobUrl, jobTitle } = dto;

    try {
      this.logger.log(`Starting streaming proposal for user ${userId}, profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId, authorization);
      assertProfileOwnedByUser(profile, userId);

      const enhancedProfile = this.applyOverrides(profile, tone, style);

      this.logger.log('Retrieving RAG context');
      const ragContext = await this.ragService.retrieveContext(jobDescription, enhancedProfile);

      if (ragContext.totalRetrieved > 0) {
        this.logger.log(
          `RAG context: ${ragContext.proposalExamples.length} examples, ${ragContext.writingTemplates.length} templates`
        );
      }

      this.logger.log('Building streaming prompt');
      const { system, user, metadata } = this.promptBuilder.buildPrompt(
        enhancedProfile,
        jobDescription,
        ragContext
      );

      const fullPrompt = `${system}\n\n${user}`;

      this.sendMetadata(response, metadata);

      this.logger.log('Starting Gemini streaming');
      const fullContent = await this.streamFromGemini(fullPrompt, response, abortSignal);

      if (abortSignal?.aborted) {
        if (!response.writableEnded) {
          response.end();
        }
        return;
      }

      this.logger.log('Streaming completed, saving proposal');
      await this.saveStreamedProposal(
        profileId,
        jobId,
        jobUrl,
        jobTitle,
        jobDescription,
        fullContent,
        {
          tone: enhancedProfile.tone,
          style: enhancedProfile.writingStyle,
          ragUsed: ragContext.totalRetrieved > 0,
          streamingUsed: true,
          aiModel: 'gemini-2.5-flash',
        },
        authorization,
        response,
      );

      this.logger.log('Streaming and save completed successfully');
    } catch (error) {
      this.logger.error('Error in streaming proposal:', error);
      this.sendError(response, error);
    }
  }

  private async streamFromGemini(
    prompt: string,
    response: Response,
    abortSignal?: AbortSignal,
  ): Promise<string> {
    try {
      const model = this.geminiConfig.getModel();
      let fullContent = '';

      const result = await model.generateContentStream(prompt, {
        signal: abortSignal,
      } as any);

      for await (const chunk of result.stream) {
        if (abortSignal?.aborted) {
          this.logger.warn('Gemini stream aborted by client disconnect');
          break;
        }
        const chunkText = chunk.text();

        if (chunkText) {
          fullContent += chunkText;
          response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      if (!abortSignal?.aborted) {
        response.write(`event: done\n`);
        response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }

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
    profileId: string,
    jobId: string | undefined,
    jobUrl: string | undefined,
    jobTitle: string | undefined,
    jobDescription: string,
    content: string,
    promptMeta: any,
    authorization: string,
    response: Response,
  ): Promise<void> {
    try {
      const result = await this.proposalClient.saveProposal({
        profileId,
        jobId,
        jobUrl,
        jobTitle,
        jobDescription,
        content,
        promptMeta,
      }, authorization);

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

  private sendMetadata(response: Response, metadata: any): void {
    try {
      response.write(`event: metadata\n`);
      response.write(`data: ${JSON.stringify(metadata)}\n\n`);
    } catch (error) {
      this.logger.error('Failed to send metadata:', error);
    }
  }
}
