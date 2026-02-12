import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateProposalDto {
  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @IsString()
  @IsNotEmpty()
  jobDescription!: string;
}

export class ProposalResponseDto {
  proposal!: string;
}
