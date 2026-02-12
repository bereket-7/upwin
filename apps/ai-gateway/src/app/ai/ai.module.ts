import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProfileClient } from './http/profile.client';
import { PromptBuilder } from './prompt.builder';
import { GeminiConfig } from './config/gemini.config';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [ConfigModule, RagModule],
  controllers: [AiController],
  providers: [
    AiService,
    ProfileClient,
    PromptBuilder,
    GeminiConfig,
  ],
  exports: [AiService],
})
export class AiModule {}
