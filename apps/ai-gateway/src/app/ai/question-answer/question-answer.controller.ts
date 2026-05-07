import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Headers, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuestionAnswerService } from './question-answer.service';
import { AnswerQuestionsDto, AnswerQuestionsResponseDto } from '../dto/answer-questions.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('ai/jobs/questions')
@UseGuards(AuthGuard('jwt'))
export class QuestionAnswerController {
  private readonly logger = new Logger(QuestionAnswerController.name);

  constructor(private readonly questionAnswerService: QuestionAnswerService) {}

  @Post('answer')
  @HttpCode(HttpStatus.OK)
  async answerQuestions(
    @Body() dto: AnswerQuestionsDto,
    @Headers('authorization') authorization: string,
    @Request() req: AuthenticatedRequest
  ): Promise<AnswerQuestionsResponseDto> {
    this.logger.log(`Received request to answer ${dto.questions.length} questions for profile: ${dto.profileId}`);
    return this.questionAnswerService.answerQuestions(req.user.userId, dto, authorization);
  }
}
