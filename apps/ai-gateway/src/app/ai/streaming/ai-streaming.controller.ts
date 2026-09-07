import { Controller, Post, Body, Res, Req, Logger, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AiStreamingService } from './ai-streaming.service';
import { StreamProposalDto } from '../dto/stream-proposal.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('ai/proposals')
@UseGuards(AuthGuard('jwt'))
export class AiStreamingController {
  private readonly logger = new Logger(AiStreamingController.name);

  constructor(private readonly streamingService: AiStreamingService) {}

  @Post('stream')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 8, ttl: 10000 } })
  async streamProposal(
    @Body() dto: StreamProposalDto,
    @Headers('authorization') authorization: string,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    this.logger.log(`Streaming proposal request for profile: ${dto.profileId}`);

    this.streamingService.sendStreamHeaders(response);

    const abortController = new AbortController();

    request.on('close', () => {
      this.logger.log('Client disconnected from stream');
      abortController.abort();
      if (!response.writableEnded) {
        response.end();
      }
    });

    request.on('error', (error) => {
      this.logger.error('Request error:', error);
      abortController.abort();
      if (!response.writableEnded) {
        response.end();
      }
    });

    try {
      await this.streamingService.streamProposal(
        request.user.userId,
        dto,
        authorization,
        response,
        abortController.signal,
      );
    } catch (error) {
      this.logger.error('Streaming error:', error);

      if (!response.writableEnded) {
        const errorMessage = error instanceof Error ? error.message : 'Streaming failed';
        response.write(`event: error\n`);
        response.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        response.end();
      }
    }
  }
}
