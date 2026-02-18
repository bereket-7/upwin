import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum PreferenceCategory {
  TONE = 'TONE',
  WRITING_STYLE = 'WRITING_STYLE',
  LENGTH = 'LENGTH',
}

export class QueryAIPreferenceDto {
  @IsEnum(PreferenceCategory)
  @IsOptional()
  category?: PreferenceCategory;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;
}
