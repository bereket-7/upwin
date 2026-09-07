export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  linkedinId: string | null;
  provider: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Clean DTO for login responses - only frontend-needed fields
export interface LoginUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  upworkId: string | null;
  role: string;
  emailVerified: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  jti?: string;
}

export interface OAuthProfile {
  id: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{
    value: string;
    verified?: boolean;
  }>;
  photos?: Array<{
    value: string;
  }>;
}

export interface LocalStrategyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
}