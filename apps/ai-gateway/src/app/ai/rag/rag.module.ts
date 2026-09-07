import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { QdrantClientService } from './qdrant.client';
import { QdrantConfig } from './config/qdrant.config';
import { EmbeddingService } from './embedding.service';
import { QdrantInitializerService } from './qdrant-initializer.service';
import { GeminiModule } from '../config/gemini.module';

@Module({
  imports: [ConfigModule, GeminiModule],
  providers: [
    RagService,
    QdrantClientService,
    QdrantConfig,
    EmbeddingService,
    QdrantInitializerService,
  ],
  exports: [RagService, QdrantInitializerService, QdrantConfig],
})
export class RagModule {}
