import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService as SharedTokenBlacklistService } from '@org/shared';

@Injectable()
export class TokenBlacklistService extends SharedTokenBlacklistService {
  constructor(jwtService: JwtService) {
    super(jwtService, {
      enableLogging: process.env.NODE_ENV !== 'production',
    });
  }
}