import { IsString, IsUUID } from 'class-validator';

export class LanguageItemDto {
    @IsUUID()
    id!: string;

    @IsString()
    language!: string;

    @IsString()
    level!: string;
}
