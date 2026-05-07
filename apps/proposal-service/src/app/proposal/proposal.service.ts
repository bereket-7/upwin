import { BadGatewayException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryProposalsDto } from './dto/query-proposals.dto';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Create a new proposal with initial version
   */
  async createProposal(userId: string, dto: CreateProposalDto, authorization?: string) {
    this.logger.log(`Creating proposal for user ${userId}`);
    await this.assertProfileBelongsToUser(dto.profileId, authorization);

    const proposal = await this.prisma.proposal.create({
      data: {
        userId,
        profileId: dto.profileId,
        jobId: dto.jobId,
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
  async createVersion(userId: string, proposalId: string, dto: CreateVersionDto) {
    this.logger.log(`Creating new version for proposal ${proposalId}`);

    // Get current proposal
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, userId },
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
  async updateStatus(userId: string, proposalId: string, dto: UpdateStatusDto) {
    this.logger.log(`Updating status for proposal ${proposalId} to ${dto.status}`);

    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, userId },
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
  async getProposalById(userId: string, proposalId: string) {
    this.logger.log(`Fetching proposal ${proposalId}`);

    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, userId },
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
  async listProposals(userId: string, query: QueryProposalsDto) {
    const { profileId, jobId, status, page = 1, limit = 10 } = query;

    this.logger.log(`Listing proposals with filters: ${JSON.stringify(query)}`);

    const where: any = { userId };
    if (profileId) where.profileId = profileId;
    if (jobId) where.jobId = jobId;
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
  async deleteProposal(userId: string, proposalId: string) {
    this.logger.log(`Deleting proposal ${proposalId}`);

    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, userId },
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

  private async assertProfileBelongsToUser(profileId: string, authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    let response: Response;
    try {
      response = await fetch(`${this.configService.profileServiceUrl}/profile/${profileId}`, {
        method: 'GET',
        headers: {
          Authorization: authorization,
        },
      });
    } catch (error) {
      this.logger.error('Failed to reach profile-service while validating profile ownership', error);
      throw new BadGatewayException('Failed to validate profile ownership');
    }

    if (response.ok) {
      return;
    }

    if (response.status === 401) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    if (response.status === 403 || response.status === 404) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    throw new BadGatewayException('Failed to validate profile ownership');
  }
}
