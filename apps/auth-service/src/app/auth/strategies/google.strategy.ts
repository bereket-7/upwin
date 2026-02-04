import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ConfigService } from '../../config/config.service';
import { OAuthProfile } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    configService: ConfigService
  ) {
    super({
      clientID: configService.getGoogleClientId(),
      clientSecret: configService.getGoogleClientSecret(),
      callbackURL: `${configService.getApiUrl()}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails?.[0]?.value;
      
      if (!email) {
        return done(new Error('No email provided by Google'), false);
      }

      const user = await this.authService.validateOAuthUser({
        provider: 'google',
        providerId: id,
        email,
        firstName: name?.givenName || '',
        lastName: name?.familyName || '',
        avatarUrl: photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}