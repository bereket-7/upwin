import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { AuthService } from '../auth.service';
import { ConfigService } from '../../config/config.service';
import { OAuthProfile } from '../auth.types';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
    super({
      clientID: configService.getLinkedInClientId(),
      clientSecret: configService.getLinkedInClientSecret(),
      callbackURL: `${configService.getCallbackUrl()}/auth/linkedin/callback`,
      scope: ['r_emailaddress', 'r_liteprofile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile,
    done: any,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails?.[0]?.value;
      
      if (!email) {
        return done(new Error('No email provided by LinkedIn'), null);
      }

      const user = await this.authService.validateOAuthUser({
        provider: 'linkedin',
        providerId: id,
        email,
        firstName: name?.givenName || '',
        lastName: name?.familyName || '',
        avatarUrl: photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}