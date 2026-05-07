import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @IsString()
  @IsOptional()
  jobId?: string;

  @IsString()
  @IsOptional()
  jobUrl?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsObject()
  @IsOptional()
  promptMeta?: Record<string, any>;
}
