import { Injectable, Logger } from '@nestjs/common';
import { ProfileClient } from '../http/profile.client';
import { assertProfileOwnedByUser } from '../http/assert-profile-ownership';
import { GeminiConfig } from '../config/gemini.config';
import { PromptBuilder } from '../prompt.builder';
import { ReviewJobDto, JobReviewResponseDto } from '../dto/review-job.dto';
import { Profile } from '../interfaces/profile.interface';

@Injectable()
export class JobReviewService {
  private readonly logger = new Logger(JobReviewService.name);

  constructor(
    private readonly profileClient: ProfileClient,
    private readonly geminiConfig: GeminiConfig,
    private readonly promptBuilder: PromptBuilder,
  ) {}

  async reviewJob(userId: string, dto: ReviewJobDto, authorization: string): Promise<JobReviewResponseDto> {
    const { profileId, jobDescription, jobTitle, jobBudget, clientInfo } = dto;

    try {
      this.logger.log(`Reviewing job for user ${userId}, profile: ${profileId}`);
      const profile = await this.profileClient.getProfile(profileId, authorization);
      assertProfileOwnedByUser(profile, userId);

      const breakdown = this.analyzeMatch(profile, jobDescription, jobBudget);

      const redFlags = this.detectRedFlags(jobDescription, jobTitle, jobBudget, clientInfo);

      const prompt = `${this.promptBuilder.buildReviewSystemRules()}\n\n${this.buildReviewPrompt(profile, jobDescription, jobTitle, jobBudget, breakdown, redFlags)}`;

      this.logger.log('Calling Gemini for job review analysis');
      const model = this.geminiConfig.getModel();
      const result = await model.generateContent(prompt, {
        signal: AbortSignal.timeout(30000),
      } as any);
      const aiResponse = result.response.text();

      // Step 6: Parse AI response
      const insights = this.parseAIResponse(aiResponse);

      // Step 7: Calculate overall match score
      const matchScore = this.calculateOverallScore(breakdown);
      const matchTier = this.getMatchTier(matchScore);

      // Step 8: Estimate competition
      const estimatedCompetition = this.estimateCompetition(jobDescription, jobBudget);

      // Step 9: Generate recommendation
      const recommendation = this.generateRecommendation(matchScore, redFlags, breakdown);

      return {
        review: {
          matchScore,
          matchTier,
          breakdown,
          insights,
          redFlags,
          recommendation,
          estimatedCompetition,
        },
      };
    } catch (error) {
      this.logger.error('Error reviewing job:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Analyze job-profile match
   */
  private analyzeMatch(profile: Profile, jobDescription: string, jobBudget?: string) {
    const jobLower = jobDescription.toLowerCase();

    // Skills matching
    const skillsMatch = this.calculateSkillsMatch(profile.skills, jobLower);

    // Experience matching
    const experienceMatch = this.calculateExperienceMatch(profile.experienceYrs, jobDescription);

    // Budget matching
    const budgetMatch = this.calculateBudgetMatch(profile.hourlyRate, jobBudget);

    // Portfolio relevance (reuse existing logic)
    const portfolioRelevance = this.calculatePortfolioRelevance(profile.portfolio || [], jobLower);

    return {
      skillsMatch,
      experienceMatch,
      budgetMatch,
      portfolioRelevance,
    };
  }

  private calculateSkillsMatch(userSkills: string[], jobDescription: string): number {
    if (!userSkills || userSkills.length === 0) return 0;

    let matchedSkills = 0;
    userSkills.forEach(skill => {
      if (jobDescription.includes(skill.toLowerCase())) {
        matchedSkills++;
      }
    });

    return Math.round((matchedSkills / userSkills.length) * 100);
  }

  private calculateExperienceMatch(userYears: number | undefined, jobDescription: string): number {
    if (!userYears) return 50; // Neutral if no experience data

    const jobLower = jobDescription.toLowerCase();
    
    // Extract experience requirements
    const seniorMatch = /senior|lead|principal|expert|10\+|8\+/i.test(jobLower);
    const midMatch = /mid-level|intermediate|5\+|3-5/i.test(jobLower);
    const juniorMatch = /junior|entry|1-2|beginner/i.test(jobLower);

    if (seniorMatch && userYears >= 5) return 100;
    if (seniorMatch && userYears >= 3) return 70;
    if (midMatch && userYears >= 3 && userYears <= 7) return 100;
    if (midMatch && userYears >= 2) return 80;
    if (juniorMatch && userYears <= 3) return 100;
    if (juniorMatch && userYears > 3) return 90; // Overqualified but still good

    // Default: reasonable match
    return 75;
  }

  private calculateBudgetMatch(userRate: number | undefined, jobBudget?: string): number {
    if (!userRate || !jobBudget) return 50; // Neutral if no data

    // Extract budget range
    const budgetNumbers = jobBudget.match(/\d+/g);
    if (!budgetNumbers || budgetNumbers.length === 0) return 50;

    const budgetValues = budgetNumbers.map(n => parseInt(n));
    const maxBudget = Math.max(...budgetValues);
    const minBudget = Math.min(...budgetValues);

    // Perfect match: user rate within range
    if (userRate >= minBudget && userRate <= maxBudget) return 100;

    // Close match: within 20%
    if (userRate <= maxBudget * 1.2 && userRate >= minBudget * 0.8) return 80;

    // User rate too high
    if (userRate > maxBudget) {
      const diff = ((userRate - maxBudget) / maxBudget) * 100;
      return Math.max(0, 100 - diff);
    }

    // User rate too low (undervaluing)
    if (userRate < minBudget) {
      return 60; // Still okay, but might signal quality concerns
    }

    return 50;
  }

  private calculatePortfolioRelevance(portfolio: any[], jobDescription: string): number {
    if (!portfolio || portfolio.length === 0) return 0;

    let totalRelevance = 0;
    let count = 0;

    portfolio.forEach(item => {
      let score = 0;
      
      // Check skills
      if (item.skills && Array.isArray(item.skills)) {
        item.skills.forEach((skill: string) => {
          if (jobDescription.includes(skill.toLowerCase())) {
            score += 20;
          }
        });
      }

      // Check title
      if (item.title) {
        const titleWords = item.title.toLowerCase().split(/\s+/);
        titleWords.forEach((word: string) => {
          if (word.length > 3 && jobDescription.includes(word)) {
            score += 10;
          }
        });
      }

      if (score > 0) {
        totalRelevance += Math.min(score, 100);
        count++;
      }
    });

    return count > 0 ? Math.round(totalRelevance / count) : 0;
  }

  /**
   * Phase 2: Detect red flags
   */
  private detectRedFlags(
    jobDescription: string,
    jobTitle?: string,
    jobBudget?: string,
    clientInfo?: string
  ): Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; flag: string; description: string }> {
    const flags: Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; flag: string; description: string }> = [];
    const jobLower = jobDescription.toLowerCase();

    // Vague requirements
    if (jobDescription.length < 100) {
      flags.push({
        severity: 'medium',
        flag: 'Vague Requirements',
        description: 'Job description is very short and lacks specific details',
      });
    }

    // Unrealistic expectations
    const techCount = (jobDescription.match(/\b(react|angular|vue|node|python|java|php|ruby|go|rust|swift|kotlin)\b/gi) || []).length;
    if (techCount > 8) {
      flags.push({
        severity: 'high',
        flag: 'Unrealistic Expectations',
        description: `Requires expertise in ${techCount}+ technologies - may be unrealistic`,
      });
    }

    // Suspicious language
    const urgentWords = ['urgent', 'asap', 'immediately', 'right now', 'today'];
    const hasUrgent = urgentWords.some(word => jobLower.includes(word));
    if (hasUrgent) {
      flags.push({
        severity: 'medium',
        flag: 'Urgent Timeline',
        description: 'Job emphasizes urgency - may indicate poor planning or pressure',
      });
    }

    // Low budget indicators
    const cheapWords = ['cheap', 'budget', 'low cost', 'affordable', 'inexpensive'];
    const hasCheap = cheapWords.some(word => jobLower.includes(word));
    if (hasCheap) {
      flags.push({
        severity: 'high',
        flag: 'Budget-Focused Language',
        description: 'Job description emphasizes low cost over quality',
      });
    }

    // Spec work
    const specWords = ['sample', 'test project', 'trial', 'prove yourself', 'show me what you can do'];
    const hasSpec = specWords.some(phrase => jobLower.includes(phrase));
    if (hasSpec) {
      flags.push({
        severity: 'critical',
        flag: 'Potential Spec Work',
        description: 'May be requesting free work before hiring - proceed with caution',
      });
    }

    // Missing budget
    if (!jobBudget || jobBudget.trim().length === 0) {
      flags.push({
        severity: 'low',
        flag: 'No Budget Listed',
        description: 'Budget not specified - may need to negotiate',
      });
    }

    // Vague title
    if (jobTitle && (jobTitle.toLowerCase().includes('various') || jobTitle.toLowerCase().includes('multiple'))) {
      flags.push({
        severity: 'medium',
        flag: 'Vague Job Title',
        description: 'Job title is unclear about specific role',
      });
    }

    return flags;
  }

  /**
   * Phase 3: Estimate competition
   */
  private estimateCompetition(jobDescription: string, jobBudget?: string): {
    level: 'low' | 'medium' | 'high' | 'very_high';
    reasoning: string;
  } {
    let competitionScore = 0;
    const reasons: string[] = [];

    // Popular tech stacks = higher competition
    const popularTech = ['react', 'node', 'python', 'javascript', 'typescript'];
    const techMatches = popularTech.filter(tech => jobDescription.toLowerCase().includes(tech));
    if (techMatches.length >= 2) {
      competitionScore += 30;
      reasons.push('Popular tech stack');
    }

    // Good budget = higher competition
    if (jobBudget) {
      const budgetNumbers = jobBudget.match(/\d+/g);
      if (budgetNumbers) {
        const maxBudget = Math.max(...budgetNumbers.map(n => parseInt(n)));
        if (maxBudget >= 75) {
          competitionScore += 25;
          reasons.push('Competitive budget');
        }
      }
    }

    // Well-written description = higher competition
    if (jobDescription.length > 500) {
      competitionScore += 20;
      reasons.push('Detailed job description');
    }

    // Long-term project = higher competition
    if (/long.?term|ongoing|6\+\s*months|year/i.test(jobDescription)) {
      competitionScore += 25;
      reasons.push('Long-term opportunity');
    }

    let level: 'low' | 'medium' | 'high' | 'very_high';
    if (competitionScore >= 75) level = 'very_high';
    else if (competitionScore >= 50) level = 'high';
    else if (competitionScore >= 25) level = 'medium';
    else level = 'low';

    return {
      level,
      reasoning: reasons.join(', ') || 'Standard competition expected',
    };
  }

  /**
   * Build AI prompt for insights
   */
  private buildReviewPrompt(
    profile: Profile,
    jobDescription: string,
    jobTitle?: string,
    jobBudget?: string,
    breakdown?: any,
    redFlags?: any[]
  ): string {
    return `You are an expert freelance career advisor. Analyze this job opportunity and provide specific, actionable insights.

USER PROFILE:
- Skills: ${profile.skills.join(', ') || 'Not specified'}
- Experience: ${profile.experienceYrs || 'Not specified'} years
- Hourly Rate: $${profile.hourlyRate || 'Not specified'}/hr
- Title: ${profile.title || 'Not specified'}
- Portfolio Projects: ${profile.portfolio?.length || 0}

JOB POSTING:
Title: ${jobTitle || 'Not specified'}
Budget: ${jobBudget || 'Not specified'}
Description: ${jobDescription}

MATCH ANALYSIS:
- Skills Match: ${breakdown?.skillsMatch || 0}%
- Experience Match: ${breakdown?.experienceMatch || 0}%
- Budget Match: ${breakdown?.budgetMatch || 0}%
- Portfolio Relevance: ${breakdown?.portfolioRelevance || 0}%

RED FLAGS DETECTED:
${redFlags && redFlags.length > 0 ? redFlags.map(f => `- ${f.flag}: ${f.description}`).join('\n') : 'None'}

PROVIDE:
1. STRENGTHS (2-4 specific points): What makes this user a strong candidate?
2. CONCERNS (1-3 specific points): What challenges or gaps exist?
3. OPPORTUNITIES (1-3 specific points): What positive aspects of this job?

Format your response as JSON:
{
  "strengths": ["point 1", "point 2", ...],
  "concerns": ["point 1", "point 2", ...],
  "opportunities": ["point 1", "point 2", ...]
}

Be specific, honest, and actionable. Focus on facts from the data provided.`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(aiResponse: string): {
    strengths: string[];
    concerns: string[];
    opportunities: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          strengths: parsed.strengths || [],
          concerns: parsed.concerns || [],
          opportunities: parsed.opportunities || [],
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON, using fallback');
    }

    // Fallback: basic parsing
    return {
      strengths: ['Analysis completed'],
      concerns: ['Review the match scores for details'],
      opportunities: ['Consider applying if match score is high'],
    };
  }

  /**
   * Calculate overall match score
   */
  private calculateOverallScore(breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    budgetMatch: number;
    portfolioRelevance: number;
  }): number {
    // Weighted average
    const score =
      breakdown.skillsMatch * 0.4 +
      breakdown.portfolioRelevance * 0.3 +
      breakdown.experienceMatch * 0.2 +
      breakdown.budgetMatch * 0.1;

    return Math.round(score);
  }

  /**
   * Get match tier
   */
  private getMatchTier(score: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(
    matchScore: number,
    redFlags: any[],
    breakdown: any
  ): {
    shouldApply: boolean;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
  } {
    const criticalFlags = redFlags.filter(f => f.severity === 'critical');
    const highFlags = redFlags.filter(f => f.severity === 'high');

    // Critical red flags = don't apply
    if (criticalFlags.length > 0) {
      return {
        shouldApply: false,
        confidence: 'high',
        reasoning: `Critical red flags detected: ${criticalFlags.map(f => f.flag).join(', ')}. Not recommended.`,
      };
    }

    // High match + few red flags = apply
    if (matchScore >= 70 && highFlags.length === 0) {
      return {
        shouldApply: true,
        confidence: 'high',
        reasoning: 'Strong match across skills, experience, and portfolio. Good opportunity.',
      };
    }

    // Good match but some concerns
    if (matchScore >= 60) {
      return {
        shouldApply: true,
        confidence: 'medium',
        reasoning: `Good match (${matchScore}%) but ${highFlags.length > 0 ? 'some red flags detected' : 'budget or experience concerns'}. Proceed with caution.`,
      };
    }

    // Medium match
    if (matchScore >= 40) {
      return {
        shouldApply: false,
        confidence: 'medium',
        reasoning: `Moderate match (${matchScore}%). Consider improving portfolio relevance or skills before applying.`,
      };
    }

    // Low match
    return {
      shouldApply: false,
      confidence: 'high',
      reasoning: `Low match (${matchScore}%). This job may not be a good fit for your profile.`,
    };
  }
}
