import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AIPreferenceService } from './ai-preference.service';
import { CreateAIPreferenceDto } from './dto/create-ai-preference.dto';
import { UpdateAIPreferenceDto } from './dto/update-ai-preference.dto';
import { QueryAIPreferenceDto } from './dto/query-ai-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/ai-preferences')
@UseGuards(JwtAuthGuard)
export class AIPreferenceController {
  private readonly logger = new Logger(AIPreferenceController.name);

  constructor(private readonly aiPreferenceService: AIPreferenceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAIPreferenceDto) {
    this.logger.log(`POST /admin/ai-preferences - Creating preference: ${dto.name}`);
    return this.aiPreferenceService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryAIPreferenceDto) {
    this.logger.log(`GET /admin/ai-preferences - Query: ${JSON.stringify(query)}`);
    return this.aiPreferenceService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /admin/ai-preferences/${id}`);
    return this.aiPreferenceService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAIPreferenceDto) {
    this.logger.log(`PUT /admin/ai-preferences/${id}`);
    return this.aiPreferenceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    this.logger.log(`DELETE /admin/ai-preferences/${id}`);
    return this.aiPreferenceService.remove(id);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    this.logger.log(`PATCH /admin/ai-preferences/${id}/toggle-active`);
    return this.aiPreferenceService.toggleActive(id);
  }
}
