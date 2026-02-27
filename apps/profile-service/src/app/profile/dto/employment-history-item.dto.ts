import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class EmploymentHistoryItemDto {
    @IsUUID()
    id!: string;

    @IsString()
    title!: string;

    @IsString()
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
    isCurrent!: boolean;
}
