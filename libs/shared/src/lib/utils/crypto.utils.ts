import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * Generate a cryptographically secure random token.
 * @param length - Number of random bytes (output will be 2x in hex)
 */
export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex');
};

/**
 * Generate an authorization code for OAuth flows.
 */
export const generateAuthCode = (): string => {
  return generateSecureToken(32);
};

/**
 * Generate an API key.
 */
export const generateApiKey = (): string => {
  return generateSecureToken(64);
};

/**
 * Generate a verification token for email verification.
 */
export const generateVerificationToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Hash a password using bcrypt.
 * @param password - Plain text password
 * @param rounds - Number of salt rounds (default: 12)
 */
export const hashPassword = async (
  password: string,
  rounds: number = 12
): Promise<string> => {
  return bcrypt.hash(password, rounds);
};

/**
 * Compare a plain text password with a hashed password.
 * @param password - Plain text password
 * @param hash - Hashed password
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};