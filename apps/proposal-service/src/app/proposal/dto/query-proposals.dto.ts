import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ARCHIVED = 'ARCHIVED',
}

export class QueryProposalsDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  profileId?: string;

  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
