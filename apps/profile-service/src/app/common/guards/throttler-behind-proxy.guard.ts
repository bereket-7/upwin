import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

/**
 * Custom throttler guard that uses user ID instead of IP address.
 * Falls back to IP if user is not authenticated.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated, use their user ID
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }

    // For unauthenticated requests, use IP address
    // Handle proxies by checking X-Forwarded-For header
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.connection.remoteAddress;
  }
}
