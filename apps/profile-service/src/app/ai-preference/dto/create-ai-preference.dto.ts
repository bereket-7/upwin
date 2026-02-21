import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export enum PreferenceCategory {
  TONE = 'TONE',
  WRITING_STYLE = 'WRITING_STYLE',
  LENGTH = 'LENGTH',
}

export class CreateAIPreferenceDto {
  @IsEnum(PreferenceCategory)
  @IsNotEmpty()
  category!: PreferenceCategory;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
