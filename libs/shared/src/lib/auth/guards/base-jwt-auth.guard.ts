import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export interface ITokenBlacklistService {
  isTokenBlacklisted(token: string): boolean;
}

/**
 * Base JWT authentication guard with token blacklist support.
 * Extend this class to add custom authentication logic.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class JwtAuthGuard extends BaseJwtAuthGuard {
 *   constructor(
 *     tokenBlacklistService: TokenBlacklistService,
 *     reflector: Reflector
 *   ) {
 *     super(tokenBlacklistService, reflector);
 *   }
 * }
 * ```
 */
@Injectable()
export class BaseJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly tokenBlacklistService?: ITokenBlacklistService,
    private readonly reflector?: Reflector
  ) {
    super();
  }

  /**
   * Check if route is marked as public using @Public() decorator
   */
  override canActivate(context: ExecutionContext) {
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  /**
   * Extract token from Authorization header
   */
  protected extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '');
  }

  /**
   * Handle authentication request with token blacklist check
   */
  override handleRequest(err: any, user: any, info: any, context: any) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // Check if token is blacklisted
    if (token && this.tokenBlacklistService?.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Handle authentication errors
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}
