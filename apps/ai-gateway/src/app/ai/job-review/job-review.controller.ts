import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobReviewService } from './job-review.service';
import { ReviewJobDto, JobReviewResponseDto } from '../dto/review-job.dto';

@Controller('ai/jobs')
@UseGuards(AuthGuard('jwt'))
export class JobReviewController {
  private readonly logger = new Logger(JobReviewController.name);

  constructor(private readonly jobReviewService: JobReviewService) {}

  @Post('review')
  @HttpCode(HttpStatus.OK)
  async reviewJob(
    @Body() dto: ReviewJobDto,
    @Headers('authorization') authorization: string
  ): Promise<JobReviewResponseDto> {
    this.logger.log(`Received job review request for profile: ${dto.profileId}`);
    return this.jobReviewService.reviewJob(dto, authorization);
  }
}
