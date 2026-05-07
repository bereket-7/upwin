import { Injectable, Logger } from '@nestjs/common';
import { ProfileClient } from '../http/profile.client';
import { GeminiConfig } from '../config/gemini.config';
import { AnswerQuestionsDto, QuestionAnswerDto, AnswerQuestionsResponseDto, JobQuestionDto } from '../dto/answer-questions.dto';
import { Profile } from '../interfaces/profile.interface';

// Question categories for classification
enum QuestionCategory {
  EXPERIENCE = 'experience',
  PORTFOLIO = 'portfolio',
  AVAILABILITY = 'availability',
  RATE = 'rate',
  TECHNICAL = 'technical',
  LOGISTICS = 'logistics',
  YES_NO = 'yes_no',
  OPEN_ENDED = 'open_ended',
}

@Injectable()
export class QuestionAnswerService {
  private readonly logger = new Logger(QuestionAnswerService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly geminiConfig: GeminiConfig,
  ) {}

  async answerQuestions(userId: string, dto: AnswerQuestionsDto, authorization: string): Promise<AnswerQuestionsResponseDto> {
    const { profileId, jobDescription, jobTitle, questions } = dto;

    try {
      // Step 1: Fetch profile
      this.logger.log(`Answering ${questions.length} questions for user ${userId}, profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId, authorization);

      // Step 2: Process each question
      const answers: QuestionAnswerDto[] = [];
      
      for (const question of questions) {
        const answer = await this.answerSingleQuestion(question, profile, jobDescription, jobTitle);
        answers.push(answer);
      }

      // Step 3: Calculate metadata
      const metadata = {
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        highConfidence: answers.filter(a => a.confidence === 'high').length,
        mediumConfidence: answers.filter(a => a.confidence === 'medium').length,
        lowConfidence: answers.filter(a => a.confidence === 'low').length,
      };

      this.logger.log(`Successfully answered ${answers.length} questions`);

      return { answers, metadata };
    } catch (error) {
      this.logger.error('Error answering questions:', error);
      throw error;
    }
  }

  /**
   * Answer a single question
   */
  private async answerSingleQuestion(
    question: JobQuestionDto,
    profile: Profile,
    jobDescription: string,
    jobTitle?: string
  ): Promise<QuestionAnswerDto> {
    // Phase 1: Classify the question
    const category = this.classifyQuestion(question.question);
    this.logger.log(`Question "${question.question.substring(0, 50)}..." classified as: ${category}`);

    // Phase 2: Generate answer based on category
    let answer: QuestionAnswerDto;

    switch (category) {
      case QuestionCategory.RATE:
        answer = this.answerRateQuestion(question, profile);
        break;
      
      case QuestionCategory.EXPERIENCE:
        answer = await this.answerExperienceQuestion(question, profile, jobDescription);
        break;
      
      case QuestionCategory.PORTFOLIO:
        answer = this.answerPortfolioQuestion(question, profile, jobDescription);
        break;
      
      case QuestionCategory.AVAILABILITY:
        answer = this.answerAvailabilityQuestion(question, profile);
        break;
      
      case QuestionCategory.LOGISTICS:
        answer = this.answerLogisticsQuestion(question, profile);
        break;
      
      case QuestionCategory.YES_NO:
        answer = this.answerYesNoQuestion(question, profile);
        break;
      
      case QuestionCategory.TECHNICAL:
      case QuestionCategory.OPEN_ENDED:
        answer = await this.answerWithAI(question, profile, jobDescription, jobTitle, category);
        break;
      
      default:
        answer = await this.answerWithAI(question, profile, jobDescription, jobTitle, category);
    }

    return answer;
  }

  /**
   * PHASE 1: Classify question into category
   */
  private classifyQuestion(question: string): QuestionCategory {
    const questionLower = question.toLowerCase();

    // Rate questions
    if (/\b(rate|budget|cost|price|charge|fee|hourly|salary|compensation)\b/i.test(questionLower)) {
      return QuestionCategory.RATE;
    }

    // Experience questions
    if (/\b(how many years|experience with|worked with|familiar with|background in|expertise in)\b/i.test(questionLower)) {
      return QuestionCategory.EXPERIENCE;
    }

    // Portfolio questions
    if (/\b(examples?|samples?|show|share|demonstrate|portfolio|previous work|past projects?)\b/i.test(questionLower)) {
      return QuestionCategory.PORTFOLIO;
    }

    // Availability questions
    if (/\b(when can you start|availability|available|hours per week|full.?time|part.?time|commitment)\b/i.test(questionLower)) {
      return QuestionCategory.AVAILABILITY;
    }

    // Logistics questions
    if (/\b(timezone|time zone|location|where are you|video call|meeting|communication|contact)\b/i.test(questionLower)) {
      return QuestionCategory.LOGISTICS;
    }

    // Yes/No questions
    if (/^(are you|can you|do you|will you|have you|would you|could you)\b/i.test(questionLower)) {
      return QuestionCategory.YES_NO;
    }

    // Technical questions
    if (/\b(how would you|approach|process|methodology|solve|implement|build|design|architecture)\b/i.test(questionLower)) {
      return QuestionCategory.TECHNICAL;
    }

    // Default to open-ended
    return QuestionCategory.OPEN_ENDED;
  }

  /**
   * PHASE 2: Answer rate questions
   */
  private answerRateQuestion(question: JobQuestionDto, profile: Profile): QuestionAnswerDto {
    if (profile.hourlyRate) {
      return {
        questionId: question.id,
        question: question.question,
        answer: `$${profile.hourlyRate}/hour`,
        confidence: 'high',
        source: 'profile',
        category: QuestionCategory.RATE,
      };
    }

    return {
      questionId: question.id,
      question: question.question,
      answer: 'My rate is flexible depending on project scope, duration, and requirements. I\'m happy to discuss this further.',
      confidence: 'medium',
      source: 'default',
      category: QuestionCategory.RATE,
    };
  }

  /**
   * PHASE 2: Answer experience questions
   */
  private async answerExperienceQuestion(
    question: JobQuestionDto,
    profile: Profile,
    jobDescription: string
  ): Promise<QuestionAnswerDto> {
    const questionLower = question.question.toLowerCase();
    
    // Extract technology/skill from question
    const technology = this.extractTechnology(questionLower, profile.skills);
    
    // Find relevant portfolios
    const relevantPortfolios = this.findRelevantPortfolios(
      profile.portfolio || [],
      technology || jobDescription
    );

    // Build answer
    let answer = '';
    const portfolioIds: string[] = [];

    if (profile.experienceYrs) {
      answer = `I have ${profile.experienceYrs} years of professional experience`;
      
      if (technology) {
        answer += ` with ${technology}`;
      }
      
      if (relevantPortfolios.length > 0) {
        answer += `, including ${relevantPortfolios.length} recent project${relevantPortfolios.length > 1 ? 's' : ''}: `;
        
        const projectSummaries = relevantPortfolios.slice(0, 3).map(p => {
          portfolioIds.push(p.id);
          return p.title;
        });
        
        answer += projectSummaries.join(', ');
        answer += '.';
        
        // Add skills if available
        const allSkills = new Set<string>();
        relevantPortfolios.forEach(p => {
          if (p.skills) {
            p.skills.forEach((s: string) => allSkills.add(s));
          }
        });
        
        if (allSkills.size > 0) {
          answer += ` My expertise includes ${Array.from(allSkills).slice(0, 5).join(', ')}.`;
        }
      } else {
        answer += '.';
      }

      return {
        questionId: question.id,
        question: question.question,
        answer,
        confidence: 'high',
        source: relevantPortfolios.length > 0 ? 'portfolio' : 'profile',
        relevantPortfolios: portfolioIds,
        category: QuestionCategory.EXPERIENCE,
      };
    }

    // Fallback: Use AI if no experience data
    return this.answerWithAI(question, profile, jobDescription, undefined, QuestionCategory.EXPERIENCE);
  }

  /**
   * PHASE 2: Answer portfolio questions
   */
  private answerPortfolioQuestion(
    question: JobQuestionDto,
    profile: Profile,
    jobDescription: string
  ): QuestionAnswerDto {
    const portfolios = profile.portfolio || [];
    
    if (portfolios.length === 0) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'I have extensive experience in this field and would be happy to discuss specific projects during our conversation.',
        confidence: 'low',
        source: 'default',
        category: QuestionCategory.PORTFOLIO,
      };
    }

    // Find relevant portfolios
    const relevantPortfolios = this.findRelevantPortfolios(portfolios, jobDescription);
    const portfoliosToShow = relevantPortfolios.slice(0, 3);

    if (portfoliosToShow.length === 0) {
      // Show any portfolios if none are relevant
      portfoliosToShow.push(...portfolios.slice(0, 2));
    }

    // Build answer
    let answer = 'Here are some examples of my recent work:\n\n';
    const portfolioIds: string[] = [];

    portfoliosToShow.forEach((p, index) => {
      portfolioIds.push(p.id);
      answer += `${index + 1}. ${p.title}`;
      
      if (p.description) {
        answer += `: ${p.description}`;
      }
      
      if (p.url) {
        answer += ` (${p.url})`;
      }
      
      if (p.skills && p.skills.length > 0) {
        answer += ` - Technologies: ${p.skills.join(', ')}`;
      }
      
      answer += '\n\n';
    });

    return {
      questionId: question.id,
      question: question.question,
      answer: answer.trim(),
      confidence: relevantPortfolios.length > 0 ? 'high' : 'medium',
      source: 'portfolio',
      relevantPortfolios: portfolioIds,
      category: QuestionCategory.PORTFOLIO,
    };
  }

  /**
   * PHASE 2: Answer availability questions
   */
  private answerAvailabilityQuestion(question: JobQuestionDto, profile: Profile): QuestionAnswerDto {
    const questionLower = question.question.toLowerCase();

    // Check for specific availability patterns
    if (/when can you start/i.test(questionLower)) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'I\'m available to start immediately and can begin work as soon as we finalize the project details.',
        confidence: 'medium',
        source: 'default',
        category: QuestionCategory.AVAILABILITY,
      };
    }

    if (/hours per week|full.?time|part.?time/i.test(questionLower)) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'I can commit to full-time hours (40+ hours per week) and am flexible with scheduling to meet project deadlines.',
        confidence: 'medium',
        source: 'default',
        category: QuestionCategory.AVAILABILITY,
      };
    }

    // Generic availability answer
    return {
      questionId: question.id,
      question: question.question,
      answer: 'I have flexible availability and can adjust my schedule to meet project requirements. I\'m committed to delivering quality work on time.',
      confidence: 'medium',
      source: 'default',
      category: QuestionCategory.AVAILABILITY,
    };
  }

  /**
   * PHASE 2: Answer logistics questions
   */
  private answerLogisticsQuestion(question: JobQuestionDto, profile: Profile): QuestionAnswerDto {
    const questionLower = question.question.toLowerCase();

    // Timezone
    if (/timezone|time zone/i.test(questionLower)) {
      const timezone = profile.location || 'UTC';
      return {
        questionId: question.id,
        question: question.question,
        answer: `I'm based in ${timezone} and can adjust my working hours to overlap with your timezone as needed.`,
        confidence: profile.location ? 'high' : 'medium',
        source: profile.location ? 'profile' : 'default',
        category: QuestionCategory.LOGISTICS,
      };
    }

    // Location
    if (/where are you|location/i.test(questionLower)) {
      if (profile.location) {
        return {
          questionId: question.id,
          question: question.question,
          answer: `I'm located in ${profile.location}.`,
          confidence: 'high',
          source: 'profile',
          category: QuestionCategory.LOGISTICS,
        };
      }
    }

    // Video calls
    if (/video call|meeting/i.test(questionLower)) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'Yes, I\'m available for video calls and prefer to have an initial discussion to understand project requirements in detail.',
        confidence: 'high',
        source: 'default',
        category: QuestionCategory.LOGISTICS,
      };
    }

    // Communication
    if (/communication|contact/i.test(questionLower)) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'I maintain clear and regular communication throughout projects. I\'m available via Upwork messages, email, and video calls, and provide daily or weekly progress updates as needed.',
        confidence: 'high',
        source: 'default',
        category: QuestionCategory.LOGISTICS,
      };
    }

    // Generic logistics answer
    return {
      questionId: question.id,
      question: question.question,
      answer: 'I\'m flexible and can accommodate your preferences for this aspect of the project.',
      confidence: 'low',
      source: 'default',
      category: QuestionCategory.LOGISTICS,
    };
  }

  /**
   * PHASE 2: Answer yes/no questions
   */
  private answerYesNoQuestion(question: JobQuestionDto, profile: Profile): QuestionAnswerDto {
    const questionLower = question.question.toLowerCase();

    // Positive responses for common yes/no questions
    const positivePatterns = [
      /are you available/i,
      /can you (start|work|commit)/i,
      /do you have experience/i,
      /have you worked/i,
      /are you familiar/i,
      /can you provide/i,
      /are you comfortable/i,
    ];

    const isPositive = positivePatterns.some(pattern => pattern.test(questionLower));

    if (isPositive) {
      return {
        questionId: question.id,
        question: question.question,
        answer: 'Yes, absolutely. I have the experience and availability to meet your requirements.',
        confidence: 'medium',
        source: 'default',
        category: QuestionCategory.YES_NO,
      };
    }

    // Default yes with context
    return {
      questionId: question.id,
      question: question.question,
      answer: 'Yes, I can accommodate this requirement.',
      confidence: 'low',
      source: 'default',
      category: QuestionCategory.YES_NO,
    };
  }

  /**
   * PHASE 2: Answer with AI (for technical and open-ended questions)
   */
  private async answerWithAI(
    question: JobQuestionDto,
    profile: Profile,
    jobDescription: string,
    jobTitle?: string,
    category?: QuestionCategory
  ): Promise<QuestionAnswerDto> {
    try {
      const prompt = this.buildAIPrompt(question.question, profile, jobDescription, jobTitle);
      
      this.logger.log('Calling Gemini for question answer');
      const model = this.geminiConfig.getModel();
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();

      return {
        questionId: question.id,
        question: question.question,
        answer,
        confidence: 'medium',
        source: 'ai',
        category: category || QuestionCategory.OPEN_ENDED,
      };
    } catch (error) {
      this.logger.error('AI answer generation failed:', error);
      
      // Fallback answer
      return {
        questionId: question.id,
        question: question.question,
        answer: 'I have relevant experience in this area and would be happy to discuss this in more detail during our conversation.',
        confidence: 'low',
        source: 'default',
        category: category || QuestionCategory.OPEN_ENDED,
      };
    }
  }

  /**
   * Build AI prompt for complex questions
   */
  private buildAIPrompt(question: string, profile: Profile, jobDescription: string, jobTitle?: string): string {
    return `You are answering a job screening question on behalf of a freelancer. Provide a professional, specific, and confident answer.

FREELANCER PROFILE:
- Title: ${profile.title || 'Professional'}
- Skills: ${profile.skills.join(', ') || 'Various technical skills'}
- Experience: ${profile.experienceYrs || 'Several'} years
- Bio: ${profile.bio || 'Experienced professional'}

JOB CONTEXT:
- Title: ${jobTitle || 'Not specified'}
- Description: ${jobDescription.substring(0, 500)}...

QUESTION:
"${question}"

INSTRUCTIONS:
1. Answer in first person
2. Be specific and confident
3. Keep it concise (2-4 sentences)
4. Demonstrate expertise
5. Reference relevant experience from the profile
6. Don't make up specific projects or numbers not in the profile
7. Be professional but personable

ANSWER:`;
  }

  /**
   * Helper: Extract technology/skill from question
   */
  private extractTechnology(question: string, userSkills: string[]): string | null {
    const questionLower = question.toLowerCase();
    
    // Check if any user skill is mentioned in the question
    for (const skill of userSkills) {
      if (questionLower.includes(skill.toLowerCase())) {
        return skill;
      }
    }

    // Common technologies
    const commonTech = [
      'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript',
      'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'aws', 'azure', 'docker', 'kubernetes'
    ];

    for (const tech of commonTech) {
      if (questionLower.includes(tech)) {
        return tech.charAt(0).toUpperCase() + tech.slice(1);
      }
    }

    return null;
  }

  /**
   * Helper: Find relevant portfolios
   */
  private findRelevantPortfolios(portfolios: any[], searchContext: string): any[] {
    const contextLower = searchContext.toLowerCase();
    
    const scored = portfolios.map(portfolio => {
      let score = 0;
      
      // Check skills
      if (portfolio.skills && Array.isArray(portfolio.skills)) {
        portfolio.skills.forEach((skill: string) => {
          if (contextLower.includes(skill.toLowerCase())) {
            score += 10;
          }
        });
      }
      
      // Check title
      if (portfolio.title) {
        const titleWords = portfolio.title.toLowerCase().split(/\s+/);
        titleWords.forEach((word: string) => {
          if (word.length > 3 && contextLower.includes(word)) {
            score += 5;
          }
        });
      }
      
      // Check description
      if (portfolio.description) {
        const descWords = portfolio.description.toLowerCase().split(/\s+/);
        descWords.forEach((word: string) => {
          if (word.length > 3 && contextLower.includes(word)) {
            score += 1;
          }
        });
      }
      
      return { ...portfolio, score };
    });
    
    return scored
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
