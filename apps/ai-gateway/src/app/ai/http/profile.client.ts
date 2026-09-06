import { Injectable, HttpException, HttpStatus, Logger, UnauthorizedException, NotFoundException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile } from '../interfaces/profile.interface';

@Injectable()
export class ProfileClient {
  private readonly logger = new Logger(ProfileClient.name);
  private readonly profileServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.profileServiceUrl = this.configService.get<string>('PROFILE_SERVICE_URL') || 'http://localhost:3009/api';
  }

  async getProfile(profileId: string, authorization: string): Promise<Profile> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    try {
      this.logger.log(`Fetching profile: ${profileId} from ${this.profileServiceUrl}`);

      const response = await fetch(`${this.profileServiceUrl}/profile/${profileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new UnauthorizedException('Invalid authorization token');
        }
        if (response.status === 403 || response.status === 404) {
          throw new NotFoundException(`Profile with ID ${profileId} not found`);
        }
        throw new BadGatewayException(
          `Failed to fetch profile: ${response.statusText}`
        );
      }

      const profile = await response.json();
      this.logger.log(`Successfully fetched profile: ${profileId}`);

      return this.transformToProfile(profile);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching profile ${profileId}:`, error);
      throw new HttpException(
        'Failed to communicate with profile service',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private transformToProfile(profile: any): Profile {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name || 'Unknown',
      title: profile.title || '',
      bio: profile.bio || '',
      skills: profile.skills || [],
      hourlyRate: profile.hourlyRate,
      experienceYrs: profile.experienceYrs,
      location: profile.location,
      country: profile.country,
      city: profile.city,
      avatar: profile.avatar,
      tone: profile.defaultTone || 'professional', // Deprecated fallback
      writingStyle: profile.defaultWritingStyle || 'concise', // Deprecated fallback
      preferences: profile.selectedPreferences || [], // New dynamic preferences
      portfolio: profile.portfolioItems || [],
      workHistory: profile.workHistory || [],
      totalEarnings: profile.totalEarnings,
      totalJobs: profile.totalJobs,
      totalHours: profile.totalHours,
    };
  }
}
