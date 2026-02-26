import { IsEnum, IsNotEmpty } from 'class-validator';
import { TailoringLevel } from '../../../generated/prisma';

export class UpdateTailoringDto {
  @IsEnum(TailoringLevel)
  @IsNotEmpty()
  level!: TailoringLevel;
}
