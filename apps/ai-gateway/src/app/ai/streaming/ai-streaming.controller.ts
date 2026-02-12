import { Controller, Post, Body, Res, Req, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AiStreamingService } from './ai-streaming.service';
import { StreamProposalDto } from '../dto/stream-proposal.dto';

@Controller('ai/proposals')
export class AiStreamingController {
  private readonly logger = new Logger(AiStreamingController.name);

  constructor(private readonly streamingService: AiStreamingService) {}

  @Post('stream')
  async streamProposal(
    @Body() dto: StreamProposalDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    this.logger.log(`Streaming proposal request for profile: ${dto.profileId}`);

    // Set SSE headers
    this.streamingService.sendStreamHeaders(response);

    // Handle client disconnect
    request.on('close', () => {
      this.logger.log('Client disconnected from stream');
      if (!response.writableEnded) {
        response.end();
      }
    });

    // Handle errors
    request.on('error', (error) => {
      this.logger.error('Request error:', error);
      if (!response.writableEnded) {
        response.end();
      }
    });

    try {
      // Start streaming
      await this.streamingService.streamProposal(dto, response);
    } catch (error) {
      this.logger.error('Streaming error:', error);
      
      if (!response.writableEnded) {
        const errorMessage = error instanceof Error ? error.message : 'Streaming failed';
        response.write(`event: error\n`);
        response.write(`data: ${errorMessage}\n\n`);
        response.end();
      }
    }
  }
}
