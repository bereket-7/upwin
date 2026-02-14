import { IsString, IsOptional, IsArray, IsNumber, IsInt, Min, IsDate, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioItemDto } from './portfolio-item.dto';
import { WorkHistoryItemDto } from './work-history-item.dto';

export enum ProfileType {
  CUSTOM = 'CUSTOM',
  UPWORK_IMPORT = 'UPWORK_IMPORT'
}

export class CreateProfileDto {
  @IsEnum(ProfileType)
  @IsOptional()
  type?: ProfileType;

  // Upwork source data
  @IsString()
  @IsOptional()
  upworkId?: string;

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

  // Profile content
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

  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYrs?: number;

  // Upwork stats
  @IsString()
  @IsOptional()
  totalEarnings?: string;

  @IsString()
  @IsOptional()
  totalJobs?: string;

  @IsString()
  @IsOptional()
  totalHours?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  syncedAt?: Date;

  // AI customization
  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  writingStyle?: string;

  @IsString()
  @IsOptional()
  rawText?: string;

  // Nested data
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
