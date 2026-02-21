import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SharedConfigModule, SharedConfigService } from '../config';
import { SharedJwtStrategy } from './strategies';

@Module({
  imports: [
    SharedConfigModule, // Import config module first
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [SharedConfigModule],
      inject: [SharedConfigService],
      useFactory: (configService: SharedConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn as any,
        },
      }),
    }),
  ],
  providers: [SharedJwtStrategy],
  exports: [JwtModule, PassportModule, SharedJwtStrategy],
})
export class SharedAuthModule {}
