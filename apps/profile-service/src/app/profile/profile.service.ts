import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ProfileType } from '../../generated/prisma';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProfileDto & { userId: string }) {
    const { portfolio, workHistory, userId, ...profileData } = data;

    // Check if profile already exists
    const existing = await this.prisma.profile.findFirst({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Profile already exists for this user');
    }

    return this.prisma.profile.create({
      data: {
        ...profileData,
        userId,
        type: ProfileType.CUSTOM, // Always CUSTOM for this endpoint
        portfolio: portfolio ? {
          create: portfolio,
        } : undefined,
        workHistory: workHistory ? {
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async findAllForUser(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
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
      data: profiles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.userId !== userId) {
      throw new BadRequestException('You do not have access to this profile');
    }

    return profile;
  }

  async updateUpworkProfile(id: string, userId: string, dto: UpdateProfileDto) {
    const profile = await this.findOne(id, userId);

    if (profile.type !== ProfileType.UPWORK_IMPORT) {
      throw new BadRequestException('This endpoint can only update Upwork-imported profiles. Use /custom endpoint for custom profiles.');
    }

    const { portfolio, workHistory, ...profileData } = dto;

    return this.prisma.profile.update({
      where: { id },
      data: {
        ...profileData,
        syncedAt: new Date(),
        portfolio: portfolio ? {
          deleteMany: {},
          create: portfolio,
        } : undefined,
        workHistory: workHistory ? {
          deleteMany: {},
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async updateCustomProfile(id: string, userId: string, dto: UpdateProfileDto) {
    const profile = await this.findOne(id, userId);

    if (profile.type !== ProfileType.CUSTOM) {
      throw new BadRequestException('This endpoint can only update custom profiles. Use /sync endpoint for Upwork-imported profiles.');
    }

    const { portfolio, workHistory, ...profileData } = dto;

    return this.prisma.profile.update({
      where: { id },
      data: {
        ...profileData,
        portfolio: portfolio ? {
          deleteMany: {},
          create: portfolio,
        } : undefined,
        workHistory: workHistory ? {
          deleteMany: {},
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.profile.delete({
      where: { id },
    });

    return { message: 'Profile deleted successfully' };
  }

  async importFromUpwork(userId: string, upworkData: ImportUpworkDto) {
    const { portfolio, workHistory, id: upworkId, ...profileData } = upworkData;

    // Check if this Upwork profile is already imported
    if (upworkId) {
      const existing = await this.prisma.profile.findUnique({
        where: { upworkId },
      });

      if (existing) {
        throw new ConflictException('This Upwork profile has already been imported');
      }
    }

    return this.prisma.profile.create({
      data: {
        ...profileData,
        userId,
        upworkId,
        type: ProfileType.UPWORK_IMPORT, // Always UPWORK_IMPORT for this endpoint
        syncedAt: new Date(),
        portfolio: portfolio ? {
          create: portfolio,
        } : undefined,
        workHistory: workHistory ? {
          create: workHistory,
        } : undefined,
      },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
  }
}
