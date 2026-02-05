import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  title!: string;

  @IsString()
  overview!: string;

  @IsArray()
  @IsString({ each: true })
  skills!: string[];

  @IsNumber()
  @Min(0)
  hourlyRate!: number;

  @IsNumber()
  @Min(0)
  experienceYrs!: number;

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

export class UpdateProfileDto {
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
  @Min(0)
  hourlyRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
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
