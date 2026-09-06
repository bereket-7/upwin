import { createHmac } from 'crypto';

function base64url(value: object | string): string {
  const input = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(input).toString('base64url');
}

/** Sign a HS256 JWT matching passport-jwt expectations (payload.sub = userId). */
export function signTestJwt(
  userId: string,
  options?: { email?: string; secret?: string; expiresInSeconds?: number }
): string {
  const secret = options?.secret ?? process.env.JWT_SECRET ?? 'change-me-in-local-dev';
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({
    sub: userId,
    userId,
    email: options?.email ?? `${userId}@example.com`,
    iat: now,
    exp: now + (options?.expiresInSeconds ?? 3600),
  });
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}
