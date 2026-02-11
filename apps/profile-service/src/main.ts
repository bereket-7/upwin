import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/common/filters/http-exception.filter';
import { LoggingInterceptor } from './app/common/interceptors/logging.interceptor';
import { ConfigService } from './app/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get config service
  const configService = app.get(ConfigService);
  
  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // CORS configuration
  app.enableCors({
    origin: configService.getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global logging interceptor
  if (!configService.isProduction()) {
    app.useGlobalInterceptors(new LoggingInterceptor());
  }
  
  const port = configService.getPort();
  await app.listen(port);
  
  Logger.log(
    `🚀 Profile Service is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Health check available at: http://localhost:${port}/${globalPrefix}/health`
  );
  Logger.log(`🔒 JWT Authentication enabled`);
  Logger.log(`🛡️  Rate limiting (per user):`);
  Logger.log(`   - Short: 10 requests/second`);
  Logger.log(`   - Medium: 50 requests/10 seconds`);
  Logger.log(`   - Long: 100 requests/minute`);
  Logger.log(`   - Import: 2 requests/second`);
}

bootstrap();
