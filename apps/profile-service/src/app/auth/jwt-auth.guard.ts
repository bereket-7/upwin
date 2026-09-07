import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Thin local alias so controllers keep a stable import path. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
