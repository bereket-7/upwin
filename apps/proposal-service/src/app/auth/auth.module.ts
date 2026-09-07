import { Module } from '@nestjs/common';
import { SharedAuthModule, SharedConfigModule } from '@org/shared';

@Module({
  imports: [SharedConfigModule, SharedAuthModule],
  exports: [SharedAuthModule],
})
export class AuthModule {}
