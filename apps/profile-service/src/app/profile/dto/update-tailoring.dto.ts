import { IsEnum, IsNotEmpty } from 'class-validator';
import { TailoringLevel } from '@prisma/client';

export class UpdateTailoringDto {
  @IsEnum(TailoringLevel)
  @IsNotEmpty()
  level!: TailoringLevel;
}
