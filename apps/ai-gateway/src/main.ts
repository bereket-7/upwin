/**
 * AI Gateway Service - Core AI orchestration for Upwin
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 3007;
  await app.listen(port);
  
  Logger.log(
    `🚀 AI Gateway is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📝 Generate Proposal: POST http://localhost:${port}/${globalPrefix}/generate-proposal`,
  );
}
//redploy
bootstrap();
