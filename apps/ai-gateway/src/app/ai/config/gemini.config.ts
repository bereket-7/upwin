import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiConfig {
  private readonly logger = new Logger(GeminiConfig.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly generationModel: GenerativeModel;
  private readonly embeddingModel: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Initialize Gemini 2.5 Flash for text generation
    this.generationModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Initialize embedding model
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });

    this.logger.log('Gemini models initialized successfully');
  }

  getModel(): GenerativeModel {
    return this.generationModel;
  }

  getEmbeddingModel(): GenerativeModel {
    return this.embeddingModel;
  }
}
