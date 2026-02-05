import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Request() req: any) {
    // req.user will be populated by JWT guard
    const userId = req.user?.userId;
    return this.profileService.getProfile(userId);
  }

  @Post()
  createProfile(@Request() req: any, @Body() dto: CreateProfileDto) {
    const userId = req.user?.userId;
    return this.profileService.createProfile(userId, dto);
  }

  @Patch()
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user?.userId;
    return this.profileService.updateProfile(userId, dto);
  }
}
