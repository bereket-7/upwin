import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Profile } from '../generated/prisma';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Profile> {
    return this.prisma.profile.create({
      data,
    });
  }

  async findAll(): Promise<Profile[]> {
    return this.prisma.profile.findMany();
  }

  async findByUserId(userId: string): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: { userId },
    });
  }

  async update(id: string, data: any): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Profile> {
    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
