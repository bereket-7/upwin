import { IsString, IsOptional } from 'class-validator';

export class UpdateEducationDto {
  @IsString()
  @IsOptional()
  school?: string;

  @IsString()
  @IsOptional()
  degree?: string;

  @IsString()
  @IsOptional()
  dates?: string;

  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
