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
  Request,
  Headers,
} from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProposal(
    @Request() req: AuthenticatedRequest,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateProposalDto
  ) {
    return this.proposalService.createProposal(req.user.userId, dto, authorization);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  async createVersion(
    @Request() req: AuthenticatedRequest,
    @Param('id') proposalId: string,
    @Body() dto: CreateVersionDto
  ) {
    return this.proposalService.createVersion(req.user.userId, proposalId, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') proposalId: string,
    @Body() dto: UpdateStatusDto
  ) {
    return this.proposalService.updateStatus(req.user.userId, proposalId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProposal(
    @Request() req: AuthenticatedRequest,
    @Param('id') proposalId: string
  ) {
    return this.proposalService.getProposalById(req.user.userId, proposalId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listProposals(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryProposalsDto
  ) {
    return this.proposalService.listProposals(req.user.userId, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProposal(
    @Request() req: AuthenticatedRequest,
    @Param('id') proposalId: string
  ) {
    return this.proposalService.deleteProposal(req.user.userId, proposalId);
  }
}
