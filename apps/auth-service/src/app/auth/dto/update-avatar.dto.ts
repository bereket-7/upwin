import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid avatar URL format' })
  avatarUrl!: string;
}
