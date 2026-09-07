import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { QdrantConfig } from './ai/rag/config/qdrant.config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly qdrantConfig: QdrantConfig,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'ai-gateway' };
  }

  @Get('ready')
  async ready() {
    const geminiOk = Boolean(this.configService.get<string>('GEMINI_API_KEY'));
    let qdrantOk = false;
    try {
      qdrantOk = await this.qdrantConfig.healthCheck();
    } catch {
      qdrantOk = false;
    }

    const ready = geminiOk && qdrantOk;
    return {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        geminiApiKey: geminiOk,
        qdrant: qdrantOk,
      },
    };
  }
}
