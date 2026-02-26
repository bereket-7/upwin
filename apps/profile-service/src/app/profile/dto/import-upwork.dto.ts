import { IsString, IsOptional, IsArray, IsNumber, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioItemDto } from './portfolio-item.dto';
import { WorkHistoryItemDto } from './work-history-item.dto';
import { EducationItemDto } from './education-item.dto';

export class ImportUpworkDto {
  // Profile fields
  @IsString()
  @IsOptional()
  profileName?: string;

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

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsInt()
  @IsOptional()
  experienceYrs?: number;

  // Portfolio fields
  @IsString()
  @IsOptional()
  upworkId?: string;

  @IsString()
  @IsOptional()
  portfolioName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  totalEarnings?: string;

  @IsString()
  @IsOptional()
  totalJobs?: string;

  @IsString()
  @IsOptional()
  totalHours?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  @IsOptional()
  portfolioItems?: PortfolioItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkHistoryItemDto)
  @IsOptional()
  workHistory?: WorkHistoryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  @IsOptional()
  education?: EducationItemDto[];
}
