/**
 * AI Gateway Service - Core AI orchestration for Upwin
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
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
  Logger.log(
    `❤️  Health: GET http://localhost:${port}/${globalPrefix}/health`,
  );
}
bootstrap();
