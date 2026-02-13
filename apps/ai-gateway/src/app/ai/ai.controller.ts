import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateProposalDto, ProposalResponseDto } from './dto/generate-proposal.dto';

@Controller('generate-proposal')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generateProposal(
    @Body() dto: GenerateProposalDto
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Received proposal generation request for profile: ${dto.profileId}`);
    return this.aiService.generateProposal(dto);
  }
}
