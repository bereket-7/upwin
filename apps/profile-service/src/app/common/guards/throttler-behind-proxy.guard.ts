import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

/**
 * Custom throttler guard that uses user ID instead of IP address.
 * Falls back to IP if user is not authenticated.
 * 
 * Features:
 * - Per-user rate limiting for authenticated users
 * - Per-IP rate limiting for anonymous users
 * - Handles proxies and load balancers
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * Get the tracking key for rate limiting.
   * Uses user ID if authenticated, otherwise uses IP address.
   */
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated, use their user ID
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }

    // For unauthenticated requests, use IP address
    // Handle proxies by checking X-Forwarded-For header
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ip = forwardedFor.split(',')[0].trim();
      return `ip:${ip}`;
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
}
