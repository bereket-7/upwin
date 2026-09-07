import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Headers, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateProposalDto, ProposalResponseDto } from './dto/generate-proposal.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('generate-proposal')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post()
  @Throttle({ short: { limit: 3, ttl: 1000 }, medium: { limit: 10, ttl: 10000 } })
  @HttpCode(HttpStatus.OK)
  async generateProposal(
    @Body() dto: GenerateProposalDto,
    @Headers('authorization') authorization: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Received proposal generation request for profile: ${dto.profileId}`);
    return this.aiService.generateProposal(req.user.userId, dto, authorization);
  }
}
