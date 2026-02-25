import { Module } from '@nestjs/common';
import { AIHookService } from './ai-hook.service';
import { AdminAIHookController } from './admin-ai-hook.controller';
import { ProfileAIHookController } from './profile-ai-hook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAIHookController, ProfileAIHookController],
  providers: [AIHookService],
  exports: [AIHookService],
})
export class AIHookModule {}
