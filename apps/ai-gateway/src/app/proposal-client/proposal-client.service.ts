import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface CreateProposalDto {
  userId: string;
  profileId: string;
  jobSource: string;
  jobUrl?: string;
  jobTitle?: string;
  jobDescription?: string;
  content: string;
  promptMeta?: {
    tone?: string;
    style?: string;
    length?: string;
    ragUsed?: boolean;
    streamingUsed?: boolean;
    aiModel?: string;
  };
}

export interface ProposalResponse {
  id: string;
  currentVersion: number;
}

@Injectable()
export class ProposalClientService {
  private readonly logger = new Logger(ProposalClientService.name);
  private readonly proposalServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.proposalServiceUrl = this.configService.get<string>(
      'PROPOSAL_SERVICE_URL',
      'http://localhost:3010/api',
    );
    this.logger.log(`ProposalClient initialized: ${this.proposalServiceUrl}`);
  }

  /**
   * Save a generated proposal to proposal-service
   * Non-blocking: errors are logged but not thrown
   */
  async saveProposal(
    dto: CreateProposalDto,
  ): Promise<ProposalResponse | null> {
    try {
      this.logger.log(
        `Saving proposal for user ${dto.userId}, profile ${dto.profileId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<ProposalResponse>(
          `${this.proposalServiceUrl}/proposals`,
          dto,
          {
            timeout: 5000, // 5 second timeout
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `Proposal saved successfully: ${response.data.id} (v${response.data.currentVersion})`,
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'saveProposal');
      return null;
    }
  }

  /**
   * Handle errors gracefully - log but don't throw
   */
  private handleError(error: unknown, operation: string): void {
    if (error instanceof AxiosError) {
      this.logger.error(
        `[${operation}] Failed to communicate with proposal-service: ${error.message}`,
        {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        },
      );
    } else if (error instanceof Error) {
      this.logger.error(
        `[${operation}] Unexpected error: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.error(`[${operation}] Unknown error occurred`, error);
    }
  }
}
