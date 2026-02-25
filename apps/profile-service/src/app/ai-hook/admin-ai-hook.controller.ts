import {
  Controller,
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
import { JwtAuthGuard, AdminGuard } from '@org/shared';

@Controller('admin/ai-hooks')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAIHookController {
  private readonly logger = new Logger(AdminAIHookController.name);

  constructor(private readonly aiHookService: AIHookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAIHookDto) {
    this.logger.log(`POST /admin/ai-hooks - Creating system hook: ${dto.title}`);
    return this.aiHookService.createSystem({ ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    this.logger.log(`DELETE /admin/ai-hooks/${id}`);
    return this.aiHookService.remove(id);
  }
}
