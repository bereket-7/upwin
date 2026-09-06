import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAIHookDto } from './dto/create-ai-hook.dto';
import { UpdateAIHookDto } from './dto/update-ai-hook.dto';

@Injectable()
export class AIHookService {
  private readonly logger = new Logger(AIHookService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a hook (User)
   */
  async create(dto: CreateAIHookDto) {
    this.logger.log(`Creating user AI hook: ${dto.title}`);

    return this.prisma.aIHook.create({
      data: {
        title: dto.title,
        text: dto.text,
        preferenceId: dto.preferenceId,
        profileId: dto.profileId,
        isSystem: false,
      },
    });
  }

  /**
   * Create a system hook (Admin)
   */
  async createSystem(dto: CreateAIHookDto) {
    this.logger.log(`Creating system AI hook: ${dto.title}`);

    return this.prisma.aIHook.create({
      data: {
        title: dto.title,
        text: dto.text,
        preferenceId: dto.preferenceId,
        profileId: dto.profileId,
        isSystem: true,
      },
    });
  }

  /**
   * Find all system hooks (Admin)
   */
  async findAllSystem(preferenceId?: string) {
    return this.prisma.aIHook.findMany({
      where: {
        isSystem: true,
        ...(preferenceId ? { preferenceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find hooks for a specific preference/tone
   * Combines system hooks and profile-specific hooks
   */
  async findByPreference(preferenceId: string, profileId?: string) {
    return this.prisma.aIHook.findMany({
      where: {
        preferenceId,
        OR: [
          { isSystem: true },
          profileId ? { profileId } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a single hook by ID
   */
  async findOne(id: string) {
    const hook = await this.prisma.aIHook.findUnique({
      where: { id },
    });

    if (!hook) {
      throw new NotFoundException(`AI Hook with ID "${id}" not found`);
    }

    return hook;
  }

  /**
   * Update a hook
   */
  async update(id: string, dto: UpdateAIHookDto, profileId?: string) {
    const hook = await this.findOne(id);

    // If profileId is provided, ensure ownership
    if (profileId && hook.profileId !== profileId) {
      throw new ForbiddenException('You do not have permission to update this hook');
    }

    // System hooks can only be updated by admins (handled by controller guards)

    return this.prisma.aIHook.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a hook
   * @param profileId Required for user routes (ownership). Omit for admin routes.
   */
  async remove(id: string, profileId?: string) {
    const hook = await this.findOne(id);

    // User routes always pass profileId; fail closed if ownership does not match
    if (profileId !== undefined && hook.profileId !== profileId) {
      throw new ForbiddenException('You do not have permission to delete this hook');
    }

    await this.prisma.aIHook.delete({
      where: { id },
    });

    return { message: 'AI Hook deleted successfully' };
  }
}
