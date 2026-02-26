import { IsString, IsOptional } from 'class-validator';

export class UpdateCertificateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  credentialId?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
