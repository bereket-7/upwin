import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Headers, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobReviewService } from './job-review.service';
import { ReviewJobDto, JobReviewResponseDto } from '../dto/review-job.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('ai/jobs')
@UseGuards(AuthGuard('jwt'))
export class JobReviewController {
  private readonly logger = new Logger(JobReviewController.name);

  constructor(private readonly jobReviewService: JobReviewService) {}

  @Post('review')
  @HttpCode(HttpStatus.OK)
  async reviewJob(
    @Body() dto: ReviewJobDto,
    @Headers('authorization') authorization: string,
    @Request() req: AuthenticatedRequest
  ): Promise<JobReviewResponseDto> {
    this.logger.log(`Received job review request for profile: ${dto.profileId}`);
    return this.jobReviewService.reviewJob(req.user.userId, dto, authorization);
  }
}
