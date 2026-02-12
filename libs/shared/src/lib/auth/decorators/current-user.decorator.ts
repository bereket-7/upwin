import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request.
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return this.userService.findById(user.userId);
 * }
 * 
 * // Extract specific property
 * @Get('posts')
 * @UseGuards(JwtAuthGuard)
 * async getPosts(@CurrentUser('userId') userId: string) {
 *   return this.postService.findByUserId(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
