import { IsString, IsOptional, IsArray } from 'class-validator';

export class PortfolioItemDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  url?: string;
}
