import { IsString, IsOptional } from 'class-validator';

export class EducationItemDto {
  @IsString()
  school!: string;

  @IsString()
  degree!: string;

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
