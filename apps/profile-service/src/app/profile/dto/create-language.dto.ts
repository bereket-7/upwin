import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLanguageDto {
    @IsString()
    @IsNotEmpty()
    language!: string;

    @IsString()
    @IsNotEmpty()
    level!: string; // e.g., "Native or Bilingual", "Fluent", "Conversational", "Basic"
}
