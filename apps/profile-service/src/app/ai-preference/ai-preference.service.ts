import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAIPreferenceDto } from './dto/create-ai-preference.dto';
import { UpdateAIPreferenceDto } from './dto/update-ai-preference.dto';
import { QueryAIPreferenceDto } from './dto/query-ai-preference.dto';

@Injectable()
export class AIPreferenceService {
  private readonly logger = new Logger(AIPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new AI preference
   */
  async create(dto: CreateAIPreferenceDto) {
    this.logger.log(`Creating AI preference: ${dto.category} - ${dto.name}`);

    // Check if preference with same category and name already exists
    const existing = await this.prisma.aIPreference.findUnique({
      where: {
        category_name: {
          category: dto.category,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `AI preference with category "${dto.category}" and name "${dto.name}" already exists`
      );
    }

    const preference = await this.prisma.aIPreference.create({
      data: {
        category: dto.category,
        name: dto.name,
        value: dto.value,
        description: dto.description,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    this.logger.log(`AI preference created: ${preference.id}`);
    return preference;
  }

  /**
   * Get all AI preferences with optional filters
   */
  async findAll(query: QueryAIPreferenceDto) {
    this.logger.log(`Fetching AI preferences with filters: ${JSON.stringify(query)}`);

    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const preferences = await this.prisma.aIPreference.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return preferences;
  }

  /**
   * Get a single AI preference by ID
   */
  async findOne(id: string) {
    this.logger.log(`Fetching AI preference: ${id}`);

    const preference = await this.prisma.aIPreference.findUnique({
      where: { id },
    });

    if (!preference) {
      throw new NotFoundException(`AI preference with ID "${id}" not found`);
    }

    return preference;
  }

  /**
   * Update an AI preference
   */
  async update(id: string, dto: UpdateAIPreferenceDto) {
    this.logger.log(`Updating AI preference: ${id}`);

    // Check if preference exists
    await this.findOne(id);

    const preference = await this.prisma.aIPreference.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`AI preference updated: ${id}`);
    return preference;
  }

  /**
   * Delete an AI preference (soft delete by setting isActive to false)
   */
  async remove(id: string) {
    this.logger.log(`Deleting AI preference: ${id}`);

    // Check if preference exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    await this.prisma.aIPreference.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`AI preference deleted: ${id}`);
    return { message: 'AI preference deleted successfully' };
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string) {
    this.logger.log(`Toggling active status for AI preference: ${id}`);

    const preference = await this.findOne(id);

    const updated = await this.prisma.aIPreference.update({
      where: { id },
      data: { isActive: !preference.isActive },
    });

    this.logger.log(`AI preference active status toggled: ${id} -> ${updated.isActive}`);
    return updated;
  }
}
