import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiConfig } from './gemini.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GeminiConfig],
  exports: [GeminiConfig],
})
export class GeminiModule {}
