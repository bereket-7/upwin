import { randomBytes } from 'crypto';

export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex');
};

export const generateAuthCode = (): string => {
  return generateSecureToken(32);
};

export const generateApiKey = (): string => {
  return generateSecureToken(64);
};