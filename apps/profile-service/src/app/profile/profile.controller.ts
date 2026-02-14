import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
  createProfile(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId;
    
    // Transform field names from API format to database format
    const dto: CreateProfileDto = {
      ...body,
      type: body.profileType || body.type,
      upworkId: body.upworkProfileId || body.upworkId,
    };
    
    // Remove the old field names
    delete (dto as any).profileType;
    delete (dto as any).upworkProfileId;
    
    return this.profileService.createProfile(userId, dto);
  }

  @Patch()
  updateProfile(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId;
    
    // Transform field names from API format to database format
    const dto: UpdateProfileDto = {
      ...body,
      type: body.profileType || body.type,
      upworkId: body.upworkProfileId || body.upworkId,
    };
    
    // Remove the old field names
    delete (dto as any).profileType;
    delete (dto as any).upworkProfileId;
    
    return this.profileService.updateProfile(userId, dto);
  }
}
