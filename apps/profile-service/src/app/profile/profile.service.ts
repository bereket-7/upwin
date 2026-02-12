import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { Profile } from '../../generated/client';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const { portfolio, workHistory, ...profileData } = createProfileDto;

    return this.prisma.profile.create({
      data: {
        ...profileData,
        type: 'CUSTOM', // Always CUSTOM for direct creation
        portfolio: portfolio ? { create: portfolio } : undefined,
        workHistory: workHistory ? { create: workHistory } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async findAllForUser(
    userId: string,
    pagination: PaginationDto
  ): Promise<PaginatedResponse<Profile>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.profile.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          portfolio: true,
          workHistory: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this profile');
    }

    return profile;
  }

  async updateUpworkProfile(id: string, userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    // Check ownership first
    const profile = await this.findOne(id, userId);

    // Only allow updates for UPWORK_IMPORT profiles
    if (profile.type !== 'UPWORK_IMPORT') {
      throw new BadRequestException(
        'This endpoint is only for Upwork-imported profiles. Use PATCH /profiles/:id/custom for custom profiles.'
      );
    }

    const { portfolio, workHistory, ...profileData } = updateProfileDto;

    return this.prisma.profile.update({
      where: { id },
      data: {
        ...profileData,
        portfolio: portfolio ? { deleteMany: {}, create: portfolio } : undefined,
        workHistory: workHistory ? { deleteMany: {}, create: workHistory } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async updateCustomProfile(id: string, userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    // Check ownership first
    const profile = await this.findOne(id, userId);

    // Only allow updates for CUSTOM profiles
    if (profile.type !== 'CUSTOM') {
      throw new BadRequestException(
        'This endpoint is only for custom profiles. Use PATCH /profiles/:id for Upwork-imported profiles.'
      );
    }

    const { portfolio, workHistory, ...profileData } = updateProfileDto;

    return this.prisma.profile.update({
      where: { id },
      data: {
        ...profileData,
        portfolio: portfolio ? { deleteMany: {}, create: portfolio } : undefined,
        workHistory: workHistory ? { deleteMany: {}, create: workHistory } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async remove(id: string, userId: string): Promise<Profile> {
    // Check ownership first
    await this.findOne(id, userId);

    return this.prisma.profile.delete({
      where: { id },
    });
  }

  async importFromUpwork(userId: string, upworkData: ImportUpworkDto): Promise<Profile> {
    // Check if profile with this upworkId already exists
    const existing = upworkData.id
      ? await this.prisma.profile.findUnique({
          where: { upworkId: upworkData.id },
          include: { portfolio: true, workHistory: true },
        })
      : null;

    const profileData = {
      userId,
      type: 'UPWORK_IMPORT', // Always UPWORK_IMPORT for imports
      upworkId: upworkData.id,
      name: upworkData.name,
      avatar: upworkData.avatar,
      location: upworkData.location,
      country: upworkData.country,
      city: upworkData.city,
      title: upworkData.title,
      description: upworkData.description,
      skills: upworkData.skills || [],
      hourlyRate: upworkData.hourlyRate,
      totalEarnings: upworkData.totalEarnings,
      totalJobs: upworkData.totalJobs,
      totalHours: upworkData.totalHours,
      syncedAt: upworkData.syncedAt ? new Date(upworkData.syncedAt) : new Date(),
    };

    if (existing) {
      // Update existing profile and replace portfolio/work history
      return this.prisma.profile.update({
        where: { id: existing.id },
        data: {
          ...profileData,
          portfolio: {
            deleteMany: {},
            create: upworkData.portfolio || [],
          },
          workHistory: {
            deleteMany: {},
            create: upworkData.workHistory || [],
          },
        },
        include: {
          portfolio: true,
          workHistory: true,
        },
      });
    } else {
      // Create new profile
      return this.prisma.profile.create({
        data: {
          ...profileData,
          portfolio: upworkData.portfolio ? { create: upworkData.portfolio } : undefined,
          workHistory: upworkData.workHistory ? { create: upworkData.workHistory } : undefined,
        },
        include: {
          portfolio: true,
          workHistory: true,
        },
      });
    }
  }
}
