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
      this.logger.log(`Fetching profile: ${profileId} from ${this.profileServiceUrl}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if provided
      if (authorization) {
        headers['Authorization'] = authorization;
      }

      const response = await fetch(`${this.profileServiceUrl}/profiles/${profileId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException(
            `Profile with ID ${profileId} not found`,
            HttpStatus.NOT_FOUND
          );
        }
        throw new HttpException(
          `Failed to fetch profile: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const profile = await response.json();
      this.logger.log(`Successfully fetched profile: ${profileId}`);
      
      return profile as Profile;
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
}
