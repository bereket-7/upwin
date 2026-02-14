import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileType } from '../../generated/prisma';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        portfolio: true,
        workHistory: true,
      },
    });
    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }
    return profile;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(`Profile for user ${userId} already exists`);
    }

    const { portfolio, workHistory, ...profileData } = dto;

    return this.prisma.profile.create({
      data: {
        ...profileData,
        userId,
        type: profileData.type || (profileData.upworkId ? ProfileType.UPWORK_IMPORT : ProfileType.CUSTOM),
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    const { portfolio, workHistory, ...profileData } = dto;

    return this.prisma.profile.update({
      where: { userId },
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
}
