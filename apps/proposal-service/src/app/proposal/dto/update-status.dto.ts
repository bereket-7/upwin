import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateStatusDto {
  @IsEnum(ProposalStatus)
  @IsNotEmpty()
  status!: ProposalStatus;
}
