import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateEmploymentHistoryDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    company!: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    isCurrent?: boolean;
}
