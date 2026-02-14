import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  providers: [JwtAuthGuard, Reflector],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
