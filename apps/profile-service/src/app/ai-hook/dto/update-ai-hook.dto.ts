import { PartialType } from '@nestjs/mapped-types';
import { CreateAIHookDto } from './create-ai-hook.dto';

export class UpdateAIHookDto extends PartialType(CreateAIHookDto) {}
