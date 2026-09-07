import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard as SharedJwtAuthGuard } from '@org/shared';

/**
 * Auth routes use JwtStrategy for Postgres jti revocation.
 * Do not pass TokenBlacklistService here — shared guard expects a sync check.
 */
@Injectable()
export class JwtAuthGuard extends SharedJwtAuthGuard {
  constructor(reflector: Reflector) {
    super(undefined, reflector);
  }
}
