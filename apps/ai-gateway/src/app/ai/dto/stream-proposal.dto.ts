import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StreamProposalDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @IsString()
  @IsNotEmpty()
  jobDescription!: string;

  @IsString()
  @IsOptional()
  jobSource?: string;

  @IsString()
  @IsOptional()
  jobUrl?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  length?: 'short' | 'medium' | 'long';

  @IsString()
  @IsOptional()
  style?: string;
}
