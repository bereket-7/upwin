import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioItemDto } from './portfolio-item.dto';
import { WorkHistoryItemDto } from './work-history-item.dto';

export class ImportUpworkDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  name!: string;

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
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsString()
  @IsOptional()
  totalEarnings?: string;

  @IsString()
  @IsOptional()
  totalJobs?: string;

  @IsString()
  @IsOptional()
  totalHours?: string;

  @IsString()
  @IsOptional()
  syncedAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  @IsOptional()
  portfolio?: PortfolioItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkHistoryItemDto)
  @IsOptional()
  workHistory?: WorkHistoryItemDto[];
}
