import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateProposalDto {
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
}

export class ProposalResponseDto {
  proposal!: string;
}
