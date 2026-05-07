import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PortfolioType, TailoringLevel } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) { }

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
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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
          employmentHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          education: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          certificates: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          languages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
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
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getProfileByIdForUser(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile,
      selectedPreferences: profile.preferences.map(pp => pp.preference),
    };
  }

  /**
   * Import profile and portfolio items from Upwork
   * Creates profile if doesn't exist, adds Upwork portfolio items
   */
  async importFromUpwork(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, education, employmentHistory, bio, languages, certificates, upworkId, skills, totalEarnings, totalJobs, totalHours, profileName, avatar, location, country, city, title, hourlyRate, experienceYrs } = upworkData;

    // Get or create profile
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    // Check if upworkId is already used by another profile
    if (upworkId) {
      const existingUpworkProfile = await this.prisma.profile.findUnique({
        where: { upworkId },
      });

      if (existingUpworkProfile && existingUpworkProfile.userId !== userId) {
        throw new ConflictException('This Upwork ID is already associated with another profile');
      }
    }

    if (!profile) {
      // Create profile with Upwork data
      profile = await this.prisma.profile.create({
        data: {
          userId,
          name: profileName,
          avatar,
          location,
          country,
          city,
          title,
          hourlyRate,
          experienceYrs,
          upworkId,
          skills: skills || [],
          totalEarnings,
          totalJobs,
          totalHours,
          bio: bio?.trim(),
          syncedAt: new Date(),
        },
      });
    } else {
      // Update existing profile with Upwork data
      profile = await this.prisma.profile.update({
        where: { userId },
        data: {
          name: profileName,
          avatar,
          location,
          country,
          city,
          title,
          hourlyRate,
          experienceYrs,
          upworkId,
          skills: skills || [],
          totalEarnings,
          totalJobs,
          totalHours,
          bio: bio?.trim(),
          syncedAt: new Date(),
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

    // Add education items
    if (education && education.length > 0) {
      // Normalize and deduplicate education entries
      const normalizedEducation = education.map(item => ({
        school: item.school.trim(),
        degree: item.degree.trim(),
        dates: item.dates?.trim(),
        fieldOfStudy: item.fieldOfStudy?.trim(),
        description: item.description?.trim(),
        profileId: profile.id,
      }));

      // Remove duplicates based on school, degree, and dates
      const uniqueEducation = normalizedEducation.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.school === item.school &&
          t.degree === item.degree &&
          t.dates === item.dates
        ))
      );

      await this.prisma.educationItem.createMany({
        data: uniqueEducation,
      });
    }

    // Add employment history items
    if (employmentHistory && employmentHistory.length > 0) {
      await this.prisma.employmentHistoryItem.createMany({
        data: employmentHistory.map(item => ({
          ...item,
          title: item.title.trim(),
          company: item.company.trim(),
          location: item.location?.trim(),
          description: item.description?.trim(),
          startDate: item.startDate?.trim(),
          endDate: item.endDate?.trim(),
          profileId: profile.id,
        })),
      });
    }

    // Add language items
    if (languages && languages.length > 0) {
      await this.prisma.languageItem.createMany({
        data: languages.map(item => ({
          ...item,
          language: item.language.trim(),
          level: item.level.trim(),
          profileId: profile.id,
        })),
      });
    }

    // Add certificate items
    if (certificates && certificates.length > 0) {
      await this.prisma.certificateItem.createMany({
        data: certificates.map(item => ({
          ...item,
          name: item.name.trim(),
          issuer: item.issuer?.trim(),
          issueDate: item.issueDate?.trim(),
          expiryDate: item.expiryDate?.trim(),
          credentialId: item.credentialId?.trim(),
          url: item.url?.trim(),
          description: item.description?.trim(),
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
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Sync all Upwork data - updates profile and replaces all Upwork portfolio items
   * Custom portfolio items are not affected
   */
  async syncAllUpworkData(userId: string, upworkData: ImportUpworkDto) {
    const { portfolioItems, workHistory, education, employmentHistory, bio, languages, certificates, upworkId, skills, totalEarnings, totalJobs, totalHours, profileName, avatar, location, country, city, title, hourlyRate, experienceYrs } = upworkData;

    // Get or create profile
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // If no profile exists, create it with the Upwork data
      return this.importFromUpwork(userId, upworkData);
    }

    // Check if upworkId is already used by another profile
    if (upworkId) {
      const existingUpworkProfile = await this.prisma.profile.findUnique({
        where: { upworkId },
      });

      if (existingUpworkProfile && existingUpworkProfile.userId !== userId) {
        throw new ConflictException('This Upwork ID is already associated with another profile');
      }
    }

    // Update profile with latest Upwork data
    profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        bio: bio?.trim(),
        name: profileName,
        avatar,
        location,
        country,
        city,
        title,
        hourlyRate,
        experienceYrs,
        upworkId,
        skills: skills || [],
        totalEarnings,
        totalJobs,
        totalHours,
        syncedAt: new Date(),
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

    await this.prisma.educationItem.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    await this.prisma.employmentHistoryItem.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    await this.prisma.languageItem.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    await this.prisma.certificateItem.deleteMany({
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

    // Add new education items
    if (education && education.length > 0) {
      // Normalize and deduplicate education entries
      const normalizedEducation = education.map(item => ({
        school: item.school.trim(),
        degree: item.degree.trim(),
        dates: item.dates?.trim(),
        fieldOfStudy: item.fieldOfStudy?.trim(),
        description: item.description?.trim(),
        profileId: profile.id,
      }));

      // Remove duplicates based on school, degree, and dates
      const uniqueEducation = normalizedEducation.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.school === item.school &&
          t.degree === item.degree &&
          t.dates === item.dates
        ))
      );

      await this.prisma.educationItem.createMany({
        data: uniqueEducation,
      });
    }

    // Add new employment history items
    if (employmentHistory && employmentHistory.length > 0) {
      await this.prisma.employmentHistoryItem.createMany({
        data: employmentHistory.map(item => ({
          ...item,
          title: item.title.trim(),
          company: item.company.trim(),
          location: item.location?.trim(),
          description: item.description?.trim(),
          startDate: item.startDate?.trim(),
          endDate: item.endDate?.trim(),
          profileId: profile.id,
        })),
      });
    }

    // Add new language items
    if (languages && languages.length > 0) {
      await this.prisma.languageItem.createMany({
        data: languages.map(item => ({
          ...item,
          language: item.language.trim(),
          level: item.level.trim(),
          profileId: profile.id,
        })),
      });
    }

    // Add new certificate items
    if (certificates && certificates.length > 0) {
      await this.prisma.certificateItem.createMany({
        data: certificates.map(item => ({
          ...item,
          name: item.name.trim(),
          issuer: item.issuer?.trim(),
          issueDate: item.issueDate?.trim(),
          expiryDate: item.expiryDate?.trim(),
          credentialId: item.credentialId?.trim(),
          url: item.url?.trim(),
          description: item.description?.trim(),
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
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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

  /**
   * Update tailoring level directly on profile
   */
  async updateTailoring(userId: string, level: TailoringLevel) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: { tailoring: level },
      include: {
        preferences: {
          include: {
            preference: true,
          },
        },
        portfolioItems: true,
        workHistory: true,
        employmentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        education: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        languages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  // ==================== EDUCATION OPERATIONS ====================

  /**
   * Create a new education entry
   */
  async createEducation(userId: string, dto: any) {
    const profile = await this.getOrCreateProfile(userId);

    // Normalize data
    const normalizedData = {
      school: dto.school.trim(),
      degree: dto.degree.trim(),
      dates: dto.dates?.trim(),
      fieldOfStudy: dto.fieldOfStudy?.trim(),
      description: dto.description?.trim(),
      profileId: profile.id,
    };

    return this.prisma.educationItem.create({
      data: normalizedData,
    });
  }

  /**
   * Get all education entries for a user
   */
  async getEducation(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.educationItem.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single education entry
   */
  async getEducationItem(userId: string, educationId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const education = await this.prisma.educationItem.findUnique({
      where: { id: educationId },
    });

    if (!education || education.profileId !== profile.id) {
      throw new NotFoundException('Education entry not found');
    }

    return education;
  }

  /**
   * Update an education entry
   */
  async updateEducation(userId: string, educationId: string, dto: any) {
    await this.getEducationItem(userId, educationId);

    // Normalize data
    const normalizedData: any = {};
    if (dto.school) normalizedData.school = dto.school.trim();
    if (dto.degree) normalizedData.degree = dto.degree.trim();
    if (dto.dates !== undefined) normalizedData.dates = dto.dates?.trim();
    if (dto.fieldOfStudy !== undefined) normalizedData.fieldOfStudy = dto.fieldOfStudy?.trim();
    if (dto.description !== undefined) normalizedData.description = dto.description?.trim();

    return this.prisma.educationItem.update({
      where: { id: educationId },
      data: normalizedData,
    });
  }

  /**
   * Delete an education entry
   */
  async deleteEducation(userId: string, educationId: string) {
    await this.getEducationItem(userId, educationId);

    await this.prisma.educationItem.delete({
      where: { id: educationId },
    });

    return { message: 'Education entry deleted successfully' };
  }

  // ==================== WORK HISTORY OPERATIONS ====================

  /**
   * Create a new work history entry
   */
  async createWorkHistory(userId: string, dto: any) {
    const profile = await this.getOrCreateProfile(userId);

    // Normalize data
    const normalizedData = {
      title: dto.title.trim(),
      company: dto.company?.trim(),
      dates: dto.dates?.trim(),
      totalEarned: dto.totalEarned?.trim(),
      hours: dto.hours?.trim(),
      hourlyRate: dto.hourlyRate?.trim(),
      description: dto.description?.trim(),
      profileId: profile.id,
    };

    return this.prisma.workHistoryItem.create({
      data: normalizedData,
    });
  }

  /**
   * Get all work history entries for a user
   */
  async getWorkHistory(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.workHistoryItem.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single work history entry
   */
  async getWorkHistoryItem(userId: string, workHistoryId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const workHistory = await this.prisma.workHistoryItem.findUnique({
      where: { id: workHistoryId },
    });

    if (!workHistory || workHistory.profileId !== profile.id) {
      throw new NotFoundException('Work history entry not found');
    }

    return workHistory;
  }

  /**
   * Update a work history entry
   */
  async updateWorkHistory(userId: string, workHistoryId: string, dto: any) {
    await this.getWorkHistoryItem(userId, workHistoryId);

    // Normalize data
    const normalizedData: any = {};
    if (dto.title) normalizedData.title = dto.title.trim();
    if (dto.company !== undefined) normalizedData.company = dto.company?.trim();
    if (dto.dates !== undefined) normalizedData.dates = dto.dates?.trim();
    if (dto.totalEarned !== undefined) normalizedData.totalEarned = dto.totalEarned?.trim();
    if (dto.hours !== undefined) normalizedData.hours = dto.hours?.trim();
    if (dto.hourlyRate !== undefined) normalizedData.hourlyRate = dto.hourlyRate?.trim();
    if (dto.description !== undefined) normalizedData.description = dto.description?.trim();

    return this.prisma.workHistoryItem.update({
      where: { id: workHistoryId },
      data: normalizedData,
    });
  }

  /**
   * Delete a work history entry
   */
  async deleteWorkHistory(userId: string, workHistoryId: string) {
    await this.getWorkHistoryItem(userId, workHistoryId);

    await this.prisma.workHistoryItem.delete({
      where: { id: workHistoryId },
    });

    return { message: 'Work history entry deleted successfully' };
  }

  // ==================== CERTIFICATE OPERATIONS ====================

  /**
   * Create a new certificate entry
   */
  async createCertificate(userId: string, dto: any) {
    const profile = await this.getOrCreateProfile(userId);

    // Normalize data
    const normalizedData = {
      name: dto.name.trim(),
      issuer: dto.issuer?.trim(),
      issueDate: dto.issueDate?.trim(),
      expiryDate: dto.expiryDate?.trim(),
      credentialId: dto.credentialId?.trim(),
      url: dto.url?.trim(),
      description: dto.description?.trim(),
      profileId: profile.id,
    };

    return this.prisma.certificateItem.create({
      data: normalizedData,
    });
  }

  /**
   * Get all certificate entries for a user
   */
  async getCertificates(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.certificateItem.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single certificate entry
   */
  async getCertificateItem(userId: string, certificateId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const certificate = await this.prisma.certificateItem.findUnique({
      where: { id: certificateId },
    });

    if (!certificate || certificate.profileId !== profile.id) {
      throw new NotFoundException('Certificate entry not found');
    }

    return certificate;
  }

  /**
   * Update a certificate entry
   */
  async updateCertificate(userId: string, certificateId: string, dto: any) {
    await this.getCertificateItem(userId, certificateId);

    // Normalize data
    const normalizedData: any = {};
    if (dto.name) normalizedData.name = dto.name.trim();
    if (dto.issuer !== undefined) normalizedData.issuer = dto.issuer?.trim();
    if (dto.issueDate !== undefined) normalizedData.issueDate = dto.issueDate?.trim();
    if (dto.expiryDate !== undefined) normalizedData.expiryDate = dto.expiryDate?.trim();
    if (dto.credentialId !== undefined) normalizedData.credentialId = dto.credentialId?.trim();
    if (dto.url !== undefined) normalizedData.url = dto.url?.trim();
    if (dto.description !== undefined) normalizedData.description = dto.description?.trim();

    return this.prisma.certificateItem.update({
      where: { id: certificateId },
      data: normalizedData,
    });
  }

  /**
   * Delete a certificate entry
   */
  async deleteCertificate(userId: string, certificateId: string) {
    await this.getCertificateItem(userId, certificateId);

    await this.prisma.certificateItem.delete({
      where: { id: certificateId },
    });

    return { message: 'Certificate entry deleted successfully' };
  }

  // ==================== EMPLOYMENT HISTORY OPERATIONS ====================

  /**
   * Create a new employment history entry
   */
  async createEmploymentHistory(userId: string, dto: any) {
    const profile = await this.getOrCreateProfile(userId);

    // Normalize data
    const normalizedData = {
      title: dto.title.trim(),
      company: dto.company.trim(),
      location: dto.location?.trim(),
      description: dto.description?.trim(),
      startDate: dto.startDate?.trim(),
      endDate: dto.endDate?.trim(),
      isCurrent: dto.isCurrent ?? false,
      profileId: profile.id,
    };

    return this.prisma.employmentHistoryItem.create({
      data: normalizedData,
    });
  }

  /**
   * Get all employment history entries for a user
   */
  async getEmploymentHistory(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.employmentHistoryItem.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single employment history entry
   */
  async getEmploymentHistoryItem(userId: string, id: string) {
    const profile = await this.getOrCreateProfile(userId);

    const item = await this.prisma.employmentHistoryItem.findUnique({
      where: { id },
    });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Employment history entry not found');
    }

    return item;
  }

  /**
   * Update an employment history entry
   */
  async updateEmploymentHistory(userId: string, id: string, dto: any) {
    await this.getEmploymentHistoryItem(userId, id);

    // Normalize data
    const normalizedData: any = {};
    if (dto.title) normalizedData.title = dto.title.trim();
    if (dto.company) normalizedData.company = dto.company.trim();
    if (dto.location !== undefined) normalizedData.location = dto.location?.trim();
    if (dto.description !== undefined) normalizedData.description = dto.description?.trim();
    if (dto.startDate !== undefined) normalizedData.startDate = dto.startDate?.trim();
    if (dto.endDate !== undefined) normalizedData.endDate = dto.endDate?.trim();
    if (dto.isCurrent !== undefined) normalizedData.isCurrent = dto.isCurrent;

    return this.prisma.employmentHistoryItem.update({
      where: { id },
      data: normalizedData,
    });
  }

  /**
   * Delete an employment history entry
   */
  async deleteEmploymentHistory(userId: string, id: string) {
    await this.getEmploymentHistoryItem(userId, id);

    await this.prisma.employmentHistoryItem.delete({
      where: { id },
    });

    return { message: 'Employment history entry deleted successfully' };
  }

  // ==================== LANGUAGE OPERATIONS ====================

  /**
   * Create a new language entry
   */
  async createLanguage(userId: string, dto: any) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.languageItem.create({
      data: {
        language: dto.language.trim(),
        level: dto.level.trim(),
        profileId: profile.id,
      },
    });
  }

  /**
   * Get all language entries for a user
   */
  async getLanguages(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.languageItem.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a single language entry
   */
  async getLanguageItem(userId: string, id: string) {
    const profile = await this.getOrCreateProfile(userId);

    const item = await this.prisma.languageItem.findUnique({
      where: { id },
    });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Language entry not found');
    }

    return item;
  }

  /**
   * Update a language entry
   */
  async updateLanguage(userId: string, id: string, dto: any) {
    await this.getLanguageItem(userId, id);

    const normalizedData: any = {};
    if (dto.language) normalizedData.language = dto.language.trim();
    if (dto.level) normalizedData.level = dto.level.trim();

    return this.prisma.languageItem.update({
      where: { id },
      data: normalizedData,
    });
  }

  /**
   * Delete a language entry
   */
  async deleteLanguage(userId: string, id: string) {
    await this.getLanguageItem(userId, id);

    await this.prisma.languageItem.delete({
      where: { id },
    });

    return { message: 'Language entry deleted successfully' };
  }

  // ==================== BIO OPERATIONS ====================

  /**
   * Update profile bio
   */
  async updateBio(userId: string, bio: string) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: { bio: bio.trim() },
    });
  }
}
