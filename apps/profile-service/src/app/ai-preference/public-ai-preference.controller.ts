import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import { AIPreferenceService } from './ai-preference.service';
import { QueryAIPreferenceDto } from './dto/query-ai-preference.dto';

@Controller('ai-preferences')
export class PublicAIPreferenceController {
  private readonly logger = new Logger(PublicAIPreferenceController.name);

  constructor(private readonly aiPreferenceService: AIPreferenceService) {}

  /**
   * Public endpoint to get active AI preferences
   * Users can filter by category to get tones, writing styles, etc.
   */
  @Get()
  async findAll(@Query() query: QueryAIPreferenceDto) {
    this.logger.log(`GET /ai-preferences - Query: ${JSON.stringify(query)}`);
    
    // Force isActive to true for public endpoint
    const publicQuery = { ...query, isActive: true };
    
    return this.aiPreferenceService.findAll(publicQuery);
  }
}
