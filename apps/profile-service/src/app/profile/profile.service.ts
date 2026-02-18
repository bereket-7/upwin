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
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
      },
    });

    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId },
        include: {
          preferences: {
            include: {
              preference: true,
            },
          },
          portfolioItems: true,
          workHistory: true,
        },
      });
    }

    // Transform to include preferences array
    return {
      ...profile,
      selectedPreferences: profile.preferences.map(pp => pp.preference),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: dto,
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
      },
    });
  }

  /**
   * Import profile and portfolio items from Upwork
   * Creates profile if doesn't exist, adds Upwork portfolio items
   */
  async importFromUpwork(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, upworkId, skills, totalEarnings, totalJobs, totalHours, ...profileData } = upworkData;

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
          upworkId,
          skills: skills || [],
          totalEarnings,
          totalJobs,
          totalHours,
          syncedAt: new Date(),
          ...profileData,
        },
      });
    } else {
      // Update existing profile with Upwork data
      profile = await this.prisma.profile.update({
        where: { userId },
        data: {
          name: upworkData.profileName,
          upworkId,
          skills: skills || [],
          totalEarnings,
          totalJobs,
          totalHours,
          syncedAt: new Date(),
          ...profileData,
        },
      });
    }

    // Add portfolio items as UPWORK_IMPORT type
    if (portfolioItems && portfolioItems.length > 0) {
      await this.prisma.portfolioItem.createMany({
        data: portfolioItems.map(item => ({
          ...item,
          profileId: profile.id,
          type: PortfolioType.UPWORK_IMPORT,
        })),
      });
    }

    // Add work history items
    if (workHistory && workHistory.length > 0) {
      await this.prisma.workHistoryItem.createMany({
        data: workHistory.map(item => ({
          ...item,
          profileId: profile.id,
        })),
      });
    }

    // Return updated profile with all relations
    return this.prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
      },
    });
  }

  /**
   * Sync all Upwork data - updates profile and replaces all Upwork portfolio items
   * Custom portfolio items are not affected
   */
  async syncAllUpworkData(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, upworkId, skills, totalEarnings, totalJobs, totalHours, ...profileData } = upworkData;

    // Get or create profile
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // If no profile exists, create it with the Upwork data
      return this.importFromUpwork(userId, upworkData);
    }

    // Update profile with latest Upwork data
    profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        name: upworkData.profileName,
        upworkId,
        skills: skills || [],
        totalEarnings,
        totalJobs,
        totalHours,
        syncedAt: new Date(),
        ...profileData,
      },
    });

    // Delete all existing Upwork-imported items
    await this.prisma.portfolioItem.deleteMany({
      where: {
        profileId: profile.id,
        type: PortfolioType.UPWORK_IMPORT,
      },
    });

    await this.prisma.workHistoryItem.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    // Add new portfolio items
    if (portfolioItems && portfolioItems.length > 0) {
      await this.prisma.portfolioItem.createMany({
        data: portfolioItems.map(item => ({
          ...item,
          profileId: profile.id,
          type: PortfolioType.UPWORK_IMPORT,
        })),
      });
    }

    // Add new work history items
    if (workHistory && workHistory.length > 0) {
      await this.prisma.workHistoryItem.createMany({
        data: workHistory.map(item => ({
          ...item,
          profileId: profile.id,
        })),
      });
    }

    // Return updated profile with all relations
    return this.prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
      },
    });
  }

  // ==================== PORTFOLIO ITEM OPERATIONS ====================

  /**
   * Create a custom portfolio item
   */
  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    const profile = await this.getOrCreateProfile(userId);

    // Extract only the fields that belong to PortfolioItem
    const { name, description, skills, type } = dto;

    return this.prisma.portfolioItem.create({
      data: {
        title: name, // Map 'name' to 'title' for PortfolioItem
        description,
        skills: skills || [],
        profileId: profile.id,
        type: type || PortfolioType.CUSTOM,
      },
    });
  }

  async getPortfolios(userId: string, pagination: PaginationDto) {
    const profile = await this.getOrCreateProfile(userId);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [portfolioItems, total] = await Promise.all([
      this.prisma.portfolioItem.findMany({
        where: { profileId: profile.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.portfolioItem.count({ where: { profileId: profile.id } }),
    ]);

    return {
      data: portfolioItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPortfolio(userId: string, portfolioItemId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const portfolioItem = await this.prisma.portfolioItem.findUnique({
      where: { id: portfolioItemId },
    });

    if (!portfolioItem) {
      throw new NotFoundException('Portfolio item not found');
    }

    if (portfolioItem.profileId !== profile.id) {
      throw new BadRequestException('You do not have access to this portfolio item');
    }

    return portfolioItem;
  }

  /**
   * Update any portfolio item
   */
  async updatePortfolio(userId: string, portfolioItemId: string, dto: UpdatePortfolioDto) {
    await this.getPortfolio(userId, portfolioItemId); // Verify ownership

    // Extract only the fields that belong to PortfolioItem
    const { name, description, skills } = dto;

    return this.prisma.portfolioItem.update({
      where: { id: portfolioItemId },
      data: {
        ...(name && { title: name }), // Map 'name' to 'title'
        ...(description && { description }),
        ...(skills && { skills }),
      },
    });
  }

  /**
   * Sync Upwork portfolio items with latest data
   */
  async syncUpworkPortfolio(userId: string, portfolioItemId: string, upworkData: ImportUpworkDto) {
    const portfolioItem = await this.getPortfolio(userId, portfolioItemId);

    if (portfolioItem.type !== PortfolioType.UPWORK_IMPORT) {
      throw new BadRequestException('This endpoint can only sync Upwork-imported portfolio items');
    }

    // For individual item sync, just use syncAllUpworkData
    return this.syncAllUpworkData(userId, upworkData);
  }

  async deletePortfolio(userId: string, portfolioItemId: string) {
    await this.getPortfolio(userId, portfolioItemId); // Verify ownership

    await this.prisma.portfolioItem.delete({
      where: { id: portfolioItemId },
    });

    return { message: 'Portfolio item deleted successfully' };
  }

  // ==================== PREFERENCE OPERATIONS ====================

  /**
   * Get profile with preferences
   */
  async getProfileWithPreferences(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const profileWithPreferences = await this.prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
      },
    });

    // Transform to include preferences array
    return {
      ...profileWithPreferences,
      selectedPreferences: profileWithPreferences?.preferences.map(pp => pp.preference) || [],
    };
  }

  /**
   * Update profile preferences (replaces all)
   */
  async updatePreferences(userId: string, preferenceIds: string[]) {
    const profile = await this.getOrCreateProfile(userId);

    // Validate that all preference IDs exist and are active
    const preferences = await this.prisma.aIPreference.findMany({
      where: {
        id: { in: preferenceIds },
        isActive: true,
      },
    });

    if (preferences.length !== preferenceIds.length) {
      throw new BadRequestException('One or more preference IDs are invalid or inactive');
    }

    // Delete existing preferences
    await this.prisma.profilePreference.deleteMany({
      where: { profileId: profile.id },
    });

    // Create new preferences
    await this.prisma.profilePreference.createMany({
      data: preferenceIds.map(preferenceId => ({
        profileId: profile.id,
        preferenceId,
      })),
    });

    return this.getProfileWithPreferences(userId);
  }

  /**
   * Add a single preference to profile
   */
  async addPreference(userId: string, preferenceId: string) {
    const profile = await this.getOrCreateProfile(userId);

    // Validate preference exists and is active
    const preference = await this.prisma.aIPreference.findUnique({
      where: { id: preferenceId },
    });

    if (!preference || !preference.isActive) {
      throw new BadRequestException('Invalid or inactive preference ID');
    }

    // Check if already exists
    const existing = await this.prisma.profilePreference.findUnique({
      where: {
        profileId_preferenceId: {
          profileId: profile.id,
          preferenceId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Preference already added to profile');
    }

    // Add preference
    await this.prisma.profilePreference.create({
      data: {
        profileId: profile.id,
        preferenceId,
      },
    });

    return this.getProfileWithPreferences(userId);
  }

  /**
   * Remove a preference from profile
   */
  async removePreference(userId: string, preferenceId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const deleted = await this.prisma.profilePreference.deleteMany({
      where: {
        profileId: profile.id,
        preferenceId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Preference not found in profile');
    }

    return this.getProfileWithPreferences(userId);
  }
}
