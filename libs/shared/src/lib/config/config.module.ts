import { Module, Global } from '@nestjs/common';
import { SharedConfigService } from './config.service';

@Global()
@Module({
  providers: [SharedConfigService],
  exports: [SharedConfigService],
})
export class SharedConfigModule {}
