import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYrs?: number;

  @IsString()
  @IsOptional()
  defaultTone?: string;

  @IsString()
  @IsOptional()
  defaultWritingStyle?: string;
}
