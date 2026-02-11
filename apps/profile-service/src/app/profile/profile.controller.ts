import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@org/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body() createProfileDto: CreateProfileDto
  ) {
    // Override userId from token to prevent spoofing
    return this.profileService.create({ ...createProfileDto, userId });
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.profileService.findAllForUser(userId, pagination);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.profileService.update(id, userId, updateProfileDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.remove(id, userId);
  }

  @Post('import')
  importFromUpwork(
    @CurrentUser('userId') userId: string,
    @Body() upworkData: ImportUpworkDto
  ) {
    return this.profileService.importFromUpwork(userId, upworkData);
  }
}
