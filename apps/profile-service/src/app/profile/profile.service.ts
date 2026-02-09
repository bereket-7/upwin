import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../../generated/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    return this.prisma.profile.create({
      data: createProfileDto,
    });
  }

  async findAllForUser(userId: string): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this profile');
    }

    return profile;
  }

  async update(id: string, userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    // Check ownership first
    await this.findOne(id, userId);

    return this.prisma.profile.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async remove(id: string, userId: string): Promise<Profile> {
    // Check ownership first
    await this.findOne(id, userId);

    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
