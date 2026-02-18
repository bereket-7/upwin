import { Module } from '@nestjs/common';
import { AIPreferenceController } from './ai-preference.controller';
import { PublicAIPreferenceController } from './public-ai-preference.controller';
import { AIPreferenceService } from './ai-preference.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AIPreferenceController, PublicAIPreferenceController],
  providers: [AIPreferenceService, PrismaService],
  exports: [AIPreferenceService],
})
export class AIPreferenceModule {}
