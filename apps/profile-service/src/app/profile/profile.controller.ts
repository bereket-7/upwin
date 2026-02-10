import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    // Assuming userId comes from a header for now, as requested "Assume userId comes from request context"
    return this.profileService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.profileService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.profileService.update(id, userId, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.profileService.remove(id, userId);
  }

  @Post('import')
  importFromUpwork(@Headers('x-user-id') userId: string, @Body() upworkData: any) {
    return this.profileService.importFromUpwork(userId, upworkData);
  }
}
