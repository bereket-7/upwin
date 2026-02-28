import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { AIHookService } from './ai-hook.service';
import { CreateAIHookDto } from './dto/create-ai-hook.dto';
import { UpdateAIHookDto } from './dto/update-ai-hook.dto';
import { JwtAuthGuard, AdminGuard } from '@org/shared';

@Controller('admin/ai-hooks')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAIHookController {
  private readonly logger = new Logger(AdminAIHookController.name);

  constructor(private readonly aiHookService: AIHookService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAIHookDto) {
    this.logger.log(`POST /admin/ai-hooks - Creating system hook: ${dto.title}`);
    return this.aiHookService.createSystem({ ...dto });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('preferenceId') preferenceId?: string) {
    this.logger.log(`GET /admin/ai-hooks - Listing system hooks`);
    return this.aiHookService.findAllSystem(preferenceId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /admin/ai-hooks/${id}`);
    return this.aiHookService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateAIHookDto) {
    this.logger.log(`PATCH /admin/ai-hooks/${id}`);
    return this.aiHookService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    this.logger.log(`DELETE /admin/ai-hooks/${id}`);
    return this.aiHookService.remove(id);
  }
}
