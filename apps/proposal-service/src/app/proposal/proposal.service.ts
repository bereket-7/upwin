import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new proposal with initial version
   */
  async createProposal(dto: CreateProposalDto) {
    this.logger.log(`Creating proposal for user ${dto.userId}`);

    const proposal = await this.prisma.proposal.create({
      data: {
        userId: dto.userId,
        profileId: dto.profileId,
        jobSource: dto.jobSource,
        jobUrl: dto.jobUrl,
        jobTitle: dto.jobTitle,
        jobDescription: dto.jobDescription,
        currentVersion: 1,
        status: 'DRAFT',
        versions: {
          create: {
            version: 1,
            content: dto.content,
            promptMeta: dto.promptMeta || {},
          },
        },
      },
      include: {
        versions: true,
      },
    });

    this.logger.log(`Proposal created: ${proposal.id}`);
    return proposal;
  }

  /**
   * Add a new version to an existing proposal
   */
  async createVersion(proposalId: string, dto: CreateVersionDto) {
    this.logger.log(`Creating new version for proposal ${proposalId}`);

    // Get current proposal
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { versions: true },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    const nextVersion = proposal.currentVersion + 1;

    // Create new version and update proposal
    const [newVersion] = await this.prisma.$transaction([
      this.prisma.proposalVersion.create({
        data: {
          proposalId,
          version: nextVersion,
          content: dto.content,
          promptMeta: dto.promptMeta || {},
        },
      }),
      this.prisma.proposal.update({
        where: { id: proposalId },
        data: { currentVersion: nextVersion },
      }),
    ]);

    this.logger.log(`Version ${nextVersion} created for proposal ${proposalId}`);
    return newVersion;
  }

  /**
   * Update proposal status
   */
  async updateStatus(proposalId: string, dto: UpdateStatusDto) {
    this.logger.log(`Updating status for proposal ${proposalId} to ${dto.status}`);

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: dto.status },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    this.logger.log(`Proposal ${proposalId} status updated to ${dto.status}`);
    return updated;
  }

  /**
   * Get proposal by ID with all versions
   */
  async getProposalById(proposalId: string) {
    this.logger.log(`Fetching proposal ${proposalId}`);

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        versions: {
          orderBy: { version: 'asc' },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    return proposal;
  }

  /**
   * List proposals with filters and pagination
   */
  async listProposals(query: QueryProposalsDto) {
    const { userId, profileId, status, page = 1, limit = 10 } = query;

    this.logger.log(`Listing proposals with filters: ${JSON.stringify(query)}`);

    const where: any = {};
    if (userId) where.userId = userId;
    if (profileId) where.profileId = profileId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [proposals, total] = await this.prisma.$transaction([
      this.prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      data: proposals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete proposal (cascade deletes versions)
   */
  async deleteProposal(proposalId: string) {
    this.logger.log(`Deleting proposal ${proposalId}`);

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    await this.prisma.proposal.delete({
      where: { id: proposalId },
    });

    this.logger.log(`Proposal ${proposalId} deleted`);
    return { message: 'Proposal deleted successfully' };
  }
}
