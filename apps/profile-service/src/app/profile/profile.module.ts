import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getJwtSecret(),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, JwtStrategy],
})
export class ProfileModule {}
