import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AuthCodeService } from './auth-code.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getJwtSecret(),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    LinkedInStrategy,
    PrismaService,
    AuthCodeService,
    TokenBlacklistService,
    JwtAuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
