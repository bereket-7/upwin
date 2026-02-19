import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReviewJobDto {
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
  jobTitle?: string;

  @IsString()
  @IsOptional()
  jobBudget?: string;

  @IsString()
  @IsOptional()
  jobUrl?: string;

  @IsString()
  @IsOptional()
  clientInfo?: string;
}

export class JobReviewResponseDto {
  review!: {
    matchScore: number; // 0-100
    matchTier: 'low' | 'medium' | 'high' | 'very_high';
    breakdown: {
      skillsMatch: number;
      experienceMatch: number;
      budgetMatch: number;
      portfolioRelevance: number;
    };
    insights: {
      strengths: string[];
      concerns: string[];
      opportunities: string[];
    };
    redFlags: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      flag: string;
      description: string;
    }>;
    recommendation: {
      shouldApply: boolean;
      confidence: 'low' | 'medium' | 'high';
      reasoning: string;
    };
    estimatedCompetition?: {
      level: 'low' | 'medium' | 'high' | 'very_high';
      reasoning: string;
    };
  };
}
