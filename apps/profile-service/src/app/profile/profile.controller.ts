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
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateWorkHistoryDto } from './dto/create-work-history.dto';
import { UpdateWorkHistoryDto } from './dto/update-work-history.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateEmploymentHistoryDto } from './dto/create-employment-history.dto';
import { UpdateEmploymentHistoryDto } from './dto/update-employment-history.dto';
import { TailoringLevel } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

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

  // ==================== EDUCATION ENDPOINTS ====================

  @Post('education')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  createEducation(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEducationDto
  ) {
    return this.profileService.createEducation(userId, dto);
  }

  @Get('education')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getEducation(@CurrentUser('userId') userId: string) {
    return this.profileService.getEducation(userId);
  }

  @Get('education/:id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  getEducationItem(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.getEducationItem(userId, id);
  }

  @Patch('education/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateEducation(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateEducationDto
  ) {
    return this.profileService.updateEducation(userId, id, dto);
  }

  @Delete('education/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  deleteEducation(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.deleteEducation(userId, id);
  }

  // ==================== WORK HISTORY ENDPOINTS ====================

  @Post('work-history')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  createWorkHistory(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateWorkHistoryDto
  ) {
    return this.profileService.createWorkHistory(userId, dto);
  }

  @Get('work-history')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getWorkHistory(@CurrentUser('userId') userId: string) {
    return this.profileService.getWorkHistory(userId);
  }

  @Get('work-history/:id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  getWorkHistoryItem(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.getWorkHistoryItem(userId, id);
  }

  @Patch('work-history/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateWorkHistory(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateWorkHistoryDto
  ) {
    return this.profileService.updateWorkHistory(userId, id, dto);
  }

  @Delete('work-history/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  deleteWorkHistory(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.deleteWorkHistory(userId, id);
  }

  // ==================== EMPLOYMENT HISTORY ENDPOINTS ====================

  @Post('employment-history')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  createEmploymentHistory(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEmploymentHistoryDto
  ) {
    return this.profileService.createEmploymentHistory(userId, dto);
  }

  @Get('employment-history')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getEmploymentHistory(@CurrentUser('userId') userId: string) {
    return this.profileService.getEmploymentHistory(userId);
  }

  @Get('employment-history/:id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  getEmploymentHistoryItem(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.getEmploymentHistoryItem(userId, id);
  }

  @Patch('employment-history/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateEmploymentHistory(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateEmploymentHistoryDto
  ) {
    return this.profileService.updateEmploymentHistory(userId, id, dto);
  }

  @Delete('employment-history/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  deleteEmploymentHistory(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.deleteEmploymentHistory(userId, id);
  }

  // ==================== CERTIFICATE ENDPOINTS ====================

  @Post('certificates')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  createCertificate(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCertificateDto
  ) {
    return this.profileService.createCertificate(userId, dto);
  }

  @Get('certificates')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  getCertificates(@CurrentUser('userId') userId: string) {
    return this.profileService.getCertificates(userId);
  }

  @Get('certificates/:id')
  @Throttle({ medium: { limit: 50, ttl: 10000 } })
  getCertificateItem(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.getCertificateItem(userId, id);
  }

  @Patch('certificates/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  updateCertificate(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateCertificateDto
  ) {
    return this.profileService.updateCertificate(userId, id, dto);
  }

  @Delete('certificates/:id')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  deleteCertificate(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.profileService.deleteCertificate(userId, id);
  }
}
