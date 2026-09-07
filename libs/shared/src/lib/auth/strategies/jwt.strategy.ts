import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SharedConfigService } from '../../config';

export interface SharedJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface SharedAuthenticatedUser {
  userId: string;
  email?: string;
  role?: string;
  jti?: string;
}

@Injectable()
export class SharedJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: SharedConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: SharedJwtPayload): Promise<SharedAuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
