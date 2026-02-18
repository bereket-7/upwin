import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export class JobQuestionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[]; // For multiple choice
}

export class AnswerQuestionsDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobQuestionDto)
  questions!: JobQuestionDto[];
}

export class QuestionAnswerDto {
  questionId!: string;
  question!: string;
  answer!: string;
  confidence!: 'high' | 'medium' | 'low';
  source!: 'profile' | 'portfolio' | 'ai' | 'default';
  relevantPortfolios?: string[]; // IDs of portfolios used
  category?: string; // Question category
}

export class AnswerQuestionsResponseDto {
  answers!: QuestionAnswerDto[];
  metadata!: {
    totalQuestions: number;
    answeredQuestions: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}
