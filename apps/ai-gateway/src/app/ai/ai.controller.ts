import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { GenerateProposalDto, ProposalResponseDto } from './dto/generate-proposal.dto';

@Controller('generate-proposal')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generateProposal(
    @Body() dto: GenerateProposalDto,
    @Headers('authorization') authorization: string
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Received proposal generation request for profile: ${dto.profileId}`);
    return this.aiService.generateProposal(dto, authorization);
  }
}
