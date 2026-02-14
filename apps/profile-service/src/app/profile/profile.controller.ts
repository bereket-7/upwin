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
  Request
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  create(
    @Request() req: any,
    @Body() createProfileDto: CreateProfileDto
  ) {
    const userId = req.user?.userId;
    return this.profileService.create({ ...createProfileDto, userId });
  }

  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  findAll(
    @Request() req: any,
    @Query() pagination: PaginationDto
  ) {
    const userId = req.user?.userId;
    return this.profileService.findAllForUser(userId, pagination);
  }

  @Get(':id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  findOne(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId;
    return this.profileService.findOne(id, userId);
  }

  @Patch(':id/sync')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateUpworkProfile(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user?.userId;
    return this.profileService.updateUpworkProfile(id, userId, updateProfileDto);
  }

  @Patch(':id/custom')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateCustomProfile(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user?.userId;
    return this.profileService.updateCustomProfile(id, userId, updateProfileDto);
  }

  @Delete(':id')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  remove(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId;
    return this.profileService.remove(id, userId);
  }

  @Post('import')
  @Throttle({ short: { limit: 2, ttl: 1000 } })
  importFromUpwork(
    @Request() req: any,
    @Body() upworkData: ImportUpworkDto
  ) {
    const userId = req.user?.userId;
    return this.profileService.importFromUpwork(userId, upworkData);
  }
}
