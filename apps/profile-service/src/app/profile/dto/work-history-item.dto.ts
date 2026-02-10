import { IsString, IsOptional } from 'class-validator';

export class WorkHistoryItemDto {
  @IsString()
  title!: string;

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
  rawStats?: string;
}
