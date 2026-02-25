import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AIHookService } from './ai-hook.service';
import { CreateAIHookDto } from './dto/create-ai-hook.dto';
import { CurrentUser } from '@org/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('profile/ai-hooks')
@UseGuards(JwtAuthGuard)
export class ProfileAIHookController {
  private readonly logger = new Logger(ProfileAIHookController.name);

  constructor(
    private readonly aiHookService: AIHookService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get hooks for a specific tone preference
   */
  @Get(':preferenceId')
  async getHooks(
    @Param('preferenceId') preferenceId: string,
    @CurrentUser('userId') userId: string
  ) {
    this.logger.log(`GET /profile/ai-hooks/${preferenceId} - User: ${userId}`);
    
    // Get profile for user
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return this.aiHookService.findByPreference(preferenceId, profile?.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAIHookDto
  ) {
    this.logger.log(`POST /profile/ai-hooks - User: ${userId}`);
    
    // Get profile for user
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found'); // Should be handled by Nest interceptors or auto-created
    }

    return this.aiHookService.create({
      ...dto,
      profileId: profile.id,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    this.logger.log(`DELETE /profile/ai-hooks/${id} - User: ${userId}`);
    
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return this.aiHookService.remove(id, profile?.id);
  }
}
