import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { QdrantClientService } from './qdrant.client';
import { QdrantConfig } from './config/qdrant.config';
import { EmbeddingService } from './embedding.service';
import { GeminiConfig } from '../config/gemini.config';
import { QdrantInitializerService } from './qdrant-initializer.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RagService,
    QdrantClientService,
    QdrantConfig,
    EmbeddingService,
    GeminiConfig,
    QdrantInitializerService,
  ],
  exports: [RagService, QdrantInitializerService],
})
export class RagModule {}
