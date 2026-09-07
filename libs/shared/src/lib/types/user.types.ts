export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  googleId: string | null;
  linkedinId: string | null;
  provider: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role?: string;
  jti?: string;
}