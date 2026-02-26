import { IsString, IsOptional } from 'class-validator';

export class CreateWorkHistoryDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  dates?: string;

  @IsString()
  @IsOptional()
  totalEarned?: string;

  @IsString()
  @IsOptional()
  hours?: string;

  @IsString()
  @IsOptional()
  hourlyRate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
