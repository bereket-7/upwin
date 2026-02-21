import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark a route as public (skip authentication).
 * Use with guards that check for this metadata.
 * 
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Key used to store public route metadata
 */
export const IS_PUBLIC_KEY = 'isPublic';
