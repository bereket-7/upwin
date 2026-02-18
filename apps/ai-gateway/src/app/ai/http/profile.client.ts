import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile } from '../interfaces/profile.interface';

@Injectable()
export class ProfileClient {
  private readonly logger = new Logger(ProfileClient.name);
  private readonly profileServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.profileServiceUrl = this.configService.get<string>('PROFILE_SERVICE_URL') || 'http://localhost:3009/api';
  }

  async getProfile(profileId: string, authorization?: string): Promise<Profile> {
    try {
      this.logger.log(`Fetching portfolio: ${profileId} from ${this.profileServiceUrl}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if provided
      if (authorization) {
        headers['Authorization'] = authorization;
      }

      const response = await fetch(`${this.profileServiceUrl}/profile/portfolios/${profileId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException(
            `Portfolio with ID ${profileId} not found`,
            HttpStatus.NOT_FOUND
          );
        }
        throw new HttpException(
          `Failed to fetch portfolio: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const portfolio = await response.json();
      this.logger.log(`Successfully fetched portfolio: ${profileId}`);
      
      // Transform portfolio to match Profile interface expected by AI service
      return this.transformPortfolioToProfile(portfolio);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error fetching portfolio ${profileId}:`, error);
      throw new HttpException(
        'Failed to communicate with profile service',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private transformPortfolioToProfile(portfolio: any): Profile {
    return {
      id: portfolio.id,
      name: portfolio.profile?.name || 'Unknown',
      title: portfolio.profile?.title || '',
      bio: portfolio.description || portfolio.profile?.bio || '',
      skills: portfolio.skills || [],
      hourlyRate: portfolio.profile?.hourlyRate,
      experienceYrs: portfolio.profile?.experienceYrs,
      location: portfolio.profile?.location,
      country: portfolio.profile?.country,
      city: portfolio.profile?.city,
      avatar: portfolio.profile?.avatar,
      tone: portfolio.profile?.defaultTone || 'professional',
      writingStyle: portfolio.profile?.defaultWritingStyle || 'concise',
      portfolio: portfolio.portfolioItems || [],
      workHistory: portfolio.workHistory || [],
      totalEarnings: portfolio.totalEarnings,
      totalJobs: portfolio.totalJobs,
      totalHours: portfolio.totalHours,
    };
  }
}
