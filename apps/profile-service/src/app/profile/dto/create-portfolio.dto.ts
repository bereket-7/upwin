import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioItemDto } from './portfolio-item.dto';
import { WorkHistoryItemDto } from './work-history-item.dto';

export enum PortfolioType {
  CUSTOM = 'CUSTOM',
  UPWORK_IMPORT = 'UPWORK_IMPORT',
}

export class CreatePortfolioDto {
  @IsString()
  name!: string;

  @IsEnum(PortfolioType)
  @IsOptional()
  type?: PortfolioType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  writingStyle?: string;

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
}
