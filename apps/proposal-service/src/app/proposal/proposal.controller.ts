import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProposal(@Body() dto: CreateProposalDto) {
    return this.proposalService.createProposal(dto);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  async createVersion(
    @Param('id') proposalId: string,
    @Body() dto: CreateVersionDto
  ) {
    return this.proposalService.createVersion(proposalId, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') proposalId: string,
    @Body() dto: UpdateStatusDto
  ) {
    return this.proposalService.updateStatus(proposalId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProposal(@Param('id') proposalId: string) {
    return this.proposalService.getProposalById(proposalId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listProposals(@Query() query: QueryProposalsDto) {
    return this.proposalService.listProposals(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProposal(@Param('id') proposalId: string) {
    return this.proposalService.deleteProposal(proposalId);
  }
}
