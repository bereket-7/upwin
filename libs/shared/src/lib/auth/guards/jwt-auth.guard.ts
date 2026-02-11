import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BaseJwtAuthGuard, ITokenBlacklistService } from './base-jwt-auth.guard';

/**
 * Standard JWT authentication guard.
 * Use this guard to protect routes that require authentication.
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends BaseJwtAuthGuard {
  constructor(
    tokenBlacklistService?: ITokenBlacklistService,
    reflector?: Reflector
  ) {
    super(tokenBlacklistService, reflector);
  }
}
