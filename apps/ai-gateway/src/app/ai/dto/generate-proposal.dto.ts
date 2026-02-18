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
  jobId?: string;

  @IsString()
  @IsOptional()
  jobUrl?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;
}

export class ProposalResponseDto {
  proposal!: string;
  metadata?: {
    preferencesUsed: {
      tone?: string;
      writingStyle?: string;
      length?: string;
    };
    portfoliosUsed: Array<{
      id: string;
      title: string;
      relevanceScore: number;
    }>;
    workHistoryUsed: Array<{
      id: string;
      title: string;
      relevanceScore: number;
    }>;
  };
}
