import { IsString, IsOptional, IsArray, IsNumber, IsInt, Min } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  overview?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYrs?: number;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  writingStyle?: string;

  @IsString()
  @IsOptional()
  rawText?: string;
}
