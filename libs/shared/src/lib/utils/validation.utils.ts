export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength with detailed error messages.
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 */
export const validatePasswordStrength = (
  password: string,
  minLength: number = 8
): PasswordStrengthResult => {
  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate a URL against a list of allowed domains.
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domain names
 */
export const validateUrl = (url: string, allowedDomains: string[]): boolean => {
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};