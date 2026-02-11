import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard as SharedJwtAuthGuard } from '@org/shared';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends SharedJwtAuthGuard {
  constructor(
    tokenBlacklistService: TokenBlacklistService,
    reflector: Reflector
  ) {
    super(tokenBlacklistService, reflector);
  }
}