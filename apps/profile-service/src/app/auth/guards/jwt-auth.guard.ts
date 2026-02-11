import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard as SharedJwtAuthGuard } from '@org/shared';

@Injectable()
export class JwtAuthGuard extends SharedJwtAuthGuard {
  constructor(reflector: Reflector) {
    super(undefined, reflector);
  }
}
