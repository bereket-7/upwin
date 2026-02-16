import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PortfolioType } from '../../generated/prisma';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get or create profile for user (auto-creates if doesn't exist)
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        portfolios: {
          include: {
            portfolioItems: true,
            workHistory: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId },
        include: {
          portfolios: {
            include: {
              portfolioItems: true,
              workHistory: true,
            },
          },
        },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: dto,
      include: {
        portfolios: {
          include: {
            portfolioItems: true,
            workHistory: true,
          },
        },
      },
    });
  }

  /**
   * Import profile and portfolio from Upwork
   * Creates profile if doesn't exist, adds Upwork portfolio
   */
  async importFromUpwork(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, upworkId, portfolioName, description, skills, totalEarnings, totalJobs, totalHours, ...profileData } = upworkData;

    // Get or create profile
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create profile with Upwork data
      profile = await this.prisma.profile.create({
        data: {
          userId,
          name: upworkData.profileName,
          ...profileData,
        },
      });
    } else {
      // Update existing profile with Upwork data
      profile = await this.prisma.profile.update({
        where: { userId },
        data: {
          name: upworkData.profileName,
          ...profileData,
        },
      });
    }

    // Check if this Upwork portfolio is already imported
    if (upworkId) {
      const existing = await this.prisma.portfolio.findUnique({
        where: { upworkId },
      });

      if (existing) {
        throw new ConflictException('This Upwork portfolio has already been imported');
      }
    }

    // Create Upwork portfolio
    return this.prisma.portfolio.create({
      data: {
        profileId: profile.id,
        name: portfolioName,
        description,
        skills: skills || [],
        upworkId,
        type: PortfolioType.UPWORK_IMPORT,
        syncedAt: new Date(),
        totalEarnings,
        totalJobs,
        totalHours,
        portfolioItems: portfolioItems ? {
          create: portfolioItems,
        } : undefined,
        workHistory: workHistory ? {
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolioItems: true,
        workHistory: true,
        profile: true,
      },
    });
  }

  /**
   * Sync all Upwork data - updates profile and all Upwork portfolios
   * Custom portfolios are not affected
   */
  async syncAllUpworkData(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, upworkId, portfolioName, description, skills, totalEarnings, totalJobs, totalHours, ...profileData } = upworkData;

    // Get or create profile
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        portfolios: {
          where: { type: PortfolioType.UPWORK_IMPORT },
        },
      },
    });

    if (!profile) {
      // If no profile exists, create it with the Upwork portfolio
      return this.importFromUpwork(userId, upworkData);
    }

    // Update profile with latest Upwork data
    profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        name: upworkData.profileName,
        ...profileData,
      },
      include: {
        portfolios: {
          where: { type: PortfolioType.UPWORK_IMPORT },
        },
      },
    });

    // Find or create the Upwork portfolio
    let upworkPortfolio = profile.portfolios.find(p => p.upworkId === upworkId);

    if (!upworkPortfolio) {
      // Create new Upwork portfolio if it doesn't exist
      upworkPortfolio = await this.prisma.portfolio.create({
        data: {
          profileId: profile.id,
          name: portfolioName,
          description,
          skills: skills || [],
          upworkId,
          type: PortfolioType.UPWORK_IMPORT,
          syncedAt: new Date(),
          totalEarnings,
          totalJobs,
          totalHours,
          portfolioItems: portfolioItems ? {
            create: portfolioItems,
          } : undefined,
          workHistory: workHistory ? {
            create: workHistory,
          } : undefined,
        },
        include: {
          portfolioItems: true,
          workHistory: true,
          profile: true,
        },
      });
    } else {
      // Update existing Upwork portfolio
      upworkPortfolio = await this.prisma.portfolio.update({
        where: { id: upworkPortfolio.id },
        data: {
          name: portfolioName,
          description,
          skills: skills || [],
          totalEarnings,
          totalJobs,
          totalHours,
          syncedAt: new Date(),
          portfolioItems: portfolioItems ? {
            deleteMany: {},
            create: portfolioItems,
          } : undefined,
          workHistory: workHistory ? {
            deleteMany: {},
            create: workHistory,
          } : undefined,
        },
        include: {
          portfolioItems: true,
          workHistory: true,
          profile: true,
        },
      });
    }

    return upworkPortfolio;
  }

  // ==================== PORTFOLIO OPERATIONS ====================

  /**
   * Create a custom portfolio
   */
  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    const profile = await this.getOrCreateProfile(userId);

    const { portfolioItems, workHistory, ...portfolioData } = dto;

    return this.prisma.portfolio.create({
      data: {
        ...portfolioData,
        profileId: profile.id,
        type: PortfolioType.CUSTOM,
        portfolioItems: portfolioItems ? {
          create: portfolioItems,
        } : undefined,
        workHistory: workHistory ? {
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolioItems: true,
        workHistory: true,
        profile: true,
      },
    });
  }

  async getPortfolios(userId: string, pagination: PaginationDto) {
    const profile = await this.getOrCreateProfile(userId);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [portfolios, total] = await Promise.all([
      this.prisma.portfolio.findMany({
        where: { profileId: profile.id },
        skip,
        take: limit,
        include: {
          portfolioItems: true,
          workHistory: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.portfolio.count({ where: { profileId: profile.id } }),
    ]);

    return {
      data: portfolios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPortfolio(userId: string, portfolioId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        portfolioItems: true,
        workHistory: true,
        profile: true,
      },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    if (portfolio.profileId !== profile.id) {
      throw new BadRequestException('You do not have access to this portfolio');
    }

    return portfolio;
  }

  /**
   * Update any portfolio (custom or Upwork)
   */
  async updatePortfolio(userId: string, portfolioId: string, dto: UpdatePortfolioDto) {
    await this.getPortfolio(userId, portfolioId); // Verify ownership

    const { portfolioItems, workHistory, ...portfolioData } = dto;

    return this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        ...portfolioData,
        portfolioItems: portfolioItems ? {
          deleteMany: {},
          create: portfolioItems,
        } : undefined,
        workHistory: workHistory ? {
          deleteMany: {},
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolioItems: true,
        workHistory: true,
        profile: true,
      },
    });
  }

  /**
   * Sync Upwork portfolio with latest data
   */
  async syncUpworkPortfolio(userId: string, portfolioId: string, upworkData: ImportUpworkDto) {
    const portfolio = await this.getPortfolio(userId, portfolioId);

    if (portfolio.type !== PortfolioType.UPWORK_IMPORT) {
      throw new BadRequestException('This endpoint can only sync Upwork-imported portfolios');
    }

    const { portfolioItems, workHistory, upworkId, portfolioName, description, skills, totalEarnings, totalJobs, totalHours } = upworkData;

    return this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        name: portfolioName,
        description,
        skills: skills || [],
        totalEarnings,
        totalJobs,
        totalHours,
        syncedAt: new Date(),
        portfolioItems: portfolioItems ? {
          deleteMany: {},
          create: portfolioItems,
        } : undefined,
        workHistory: workHistory ? {
          deleteMany: {},
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolioItems: true,
        workHistory: true,
        profile: true,
      },
    });
  }

  async deletePortfolio(userId: string, portfolioId: string) {
    await this.getPortfolio(userId, portfolioId); // Verify ownership

    await this.prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    return { message: 'Portfolio deleted successfully' };
  }
}
