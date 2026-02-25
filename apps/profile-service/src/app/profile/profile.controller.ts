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
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@org/shared';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ImportUpworkDto } from './dto/import-upwork.dto';
import { UpdateProfilePreferencesDto, AddProfilePreferenceDto } from './dto/update-profile-preferences.dto';
import { UpdateTailoringDto } from './dto/update-tailoring.dto';
import { TailoringLevel } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ==================== PROFILE ENDPOINTS ====================

  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getOrCreateProfile(userId);
  }

  @Patch()
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Patch('tailoring')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateTailoring(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateTailoringDto
  ) {
    return this.profileService.updateTailoring(userId, dto.level);
  }

  @Post('import')
  @Throttle({ short: { limit: 2, ttl: 1000 } })
  importFromUpwork(
    @CurrentUser('userId') userId: string,
    @Body() upworkData: ImportUpworkDto
  ) {
    return this.profileService.importFromUpwork(userId, upworkData);
  }

  @Post('sync')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  syncAllUpworkData(
    @CurrentUser('userId') userId: string,
    @Body() upworkData: ImportUpworkDto
  ) {
    return this.profileService.syncAllUpworkData(userId, upworkData);
  }

  // ==================== PORTFOLIO ENDPOINTS ====================

  @Post('portfolios')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  createPortfolio(
    @CurrentUser('userId') userId: string,
    @Body() createPortfolioDto: CreatePortfolioDto
  ) {
    return this.profileService.createPortfolio(userId, createPortfolioDto);
  }

  @Get('portfolios')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getPortfolios(
    @CurrentUser('userId') userId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.profileService.getPortfolios(userId, pagination);
  }

  @Get('portfolios/:id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  getPortfolio(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.getPortfolio(userId, id);
  }

  @Patch('portfolios/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updatePortfolio(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto
  ) {
    return this.profileService.updatePortfolio(userId, id, updatePortfolioDto);
  }

  @Patch('portfolios/:id/sync')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  syncSingleUpworkPortfolio(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() upworkData: ImportUpworkDto
  ) {
    return this.profileService.syncUpworkPortfolio(userId, id, upworkData);
  }

  @Delete('portfolios/:id')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  deletePortfolio(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.deletePortfolio(userId, id);
  }

  // ==================== PREFERENCE ENDPOINTS ====================

  @Get('preferences')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getProfileWithPreferences(@CurrentUser('userId') userId: string) {
    return this.profileService.getProfileWithPreferences(userId);
  }

  @Put('preferences')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updatePreferences(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfilePreferencesDto
  ) {
    return this.profileService.updatePreferences(userId, dto.preferenceIds);
  }

  @Post('preferences')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  addPreference(
    @CurrentUser('userId') userId: string,
    @Body() dto: AddProfilePreferenceDto
  ) {
    return this.profileService.addPreference(userId, dto.preferenceId);
  }

  @Delete('preferences/:preferenceId')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  removePreference(
    @Param('preferenceId') preferenceId: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.removePreference(userId, preferenceId);
  }
}
