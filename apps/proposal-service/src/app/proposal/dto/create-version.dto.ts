import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsObject()
  @IsOptional()
  promptMeta?: Record<string, any>;
}
