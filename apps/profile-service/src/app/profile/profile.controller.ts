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
import { Throttle } from '@nestjs/throttler';
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
  @Throttle({ short: { limit: 5, ttl: 1000 } }) // 5 creates per second
  create(
    @CurrentUser('userId') userId: string,
    @Body() createProfileDto: CreateProfileDto
  ) {
    // Override userId from token to prevent spoofing
    return this.profileService.create({ ...createProfileDto, userId });
  }

  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  findAll(
    @CurrentUser('userId') userId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.profileService.findAllForUser(userId, pagination);
  }

  @Get(':id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } }) // 50 requests per 10 seconds
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.findOne(id, userId);
  }

  @Patch(':id')
  @Throttle({ short: { limit: 10, ttl: 1000 } }) // 10 updates per second
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.profileService.update(id, userId, updateProfileDto);
  }

  @Delete(':id')
  @Throttle({ short: { limit: 5, ttl: 1000 } }) // 5 deletes per second
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.remove(id, userId);
  }

  @Post('import')
  @Throttle({ short: { limit: 2, ttl: 1000 } }) // 2 imports per second (expensive operation)
  importFromUpwork(
    @CurrentUser('userId') userId: string,
    @Body() upworkData: ImportUpworkDto
  ) {
    return this.profileService.importFromUpwork(userId, upworkData);
  }
}
