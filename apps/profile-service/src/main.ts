/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SharedConfigService } from '@org/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get config service
  const configService = app.get(SharedConfigService);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  
  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // CORS
  app.enableCors({
    origin: configService.allowedOrigins,
    credentials: true,
  });
  
  // Start server
  const port = configService.port;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
