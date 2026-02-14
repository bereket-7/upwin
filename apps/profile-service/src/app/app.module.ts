import { Module } from '@nestjs/common';
import { SharedConfigModule, SharedAuthModule } from '@org/shared';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    SharedConfigModule,
    SharedAuthModule,
    PrismaModule,
    ProfileModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
