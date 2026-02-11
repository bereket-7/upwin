import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getJwtSecret(),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, Reflector],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
