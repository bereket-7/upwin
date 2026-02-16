import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProfileClient } from './http/profile.client';
import { PromptBuilder } from './prompt.builder';
import { GeminiConfig } from './config/gemini.config';
import { RagModule } from './rag/rag.module';
import { AiStreamingController } from './streaming/ai-streaming.controller';
import { AiStreamingService } from './streaming/ai-streaming.service';
import { ProposalClientModule } from '../proposal-client/proposal-client.module';

@Module({
  imports: [ConfigModule, RagModule, ProposalClientModule],
  controllers: [AiController, AiStreamingController],
  providers: [
    AiService,
    AiStreamingService,
    ProfileClient,
    PromptBuilder,
    GeminiConfig,
  ],
  exports: [AiService, AiStreamingService],
})
export class AiModule {}
