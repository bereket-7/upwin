import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfilePreferencesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  preferenceIds!: string[];
}

export class AddProfilePreferenceDto {
  @IsString()
  @IsNotEmpty()
  preferenceId!: string;
}
