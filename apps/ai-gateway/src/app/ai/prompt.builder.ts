import { Injectable } from '@nestjs/common';
import { Profile } from './interfaces/profile.interface';
import { RagContext } from './rag/interfaces/rag.interface';

@Injectable()
export class PromptBuilder {
  buildSystemPrompt(profile: Profile): string {
    // Extract preferences by category
    const tonePreference = profile.preferences?.find(p => p.category === 'TONE');
    const stylePreference = profile.preferences?.find(p => p.category === 'WRITING_STYLE');
    const lengthPreference = profile.preferences?.find(p => p.category === 'LENGTH');

    // Use preference values or fall back to deprecated fields or defaults
    const tone = tonePreference?.value || profile.tone || 'professional';
    const writingStyle = stylePreference?.value || profile.writingStyle || 'clear and concise';
    const length = lengthPreference?.value || 'medium';

    // Map length to word count guidance
    const lengthGuidance = this.getLengthGuidance(length);

    return `You are a professional freelancer writing a proposal for a job opportunity. Your writing must be:

TONE: ${tone}
STYLE: ${writingStyle}
LENGTH: ${lengthGuidance}

CRITICAL RULES:
- Write naturally and conversationally, like a real human freelancer
- Avoid buzzwords, clichés, and obvious AI phrasing (e.g., "leverage", "cutting-edge", "game-changer")
- Be confident but not arrogant
- Show genuine interest in the project
- Reference specific job requirements naturally
- NEVER invent skills, experience, or projects not in your profile
- Keep it ${lengthGuidance}
- Focus on value you can deliver to the client
- End with a clear call to action

IMPORTANT: Reference examples and templates are provided for INSPIRATION ONLY. They show structure and tone, but you must write original content based on YOUR profile and THIS specific job.

Your goal is to sound like a skilled professional who genuinely understands the client's needs and can deliver results.`;
  }

  private getLengthGuidance(length: string): string {
    const lengthMap: Record<string, string> = {
      short: '200-300 words',
      medium: '300-500 words',
      long: '500-700 words',
    };
    return lengthMap[length] || '300-500 words';
  }

  buildUserPrompt(profile: Profile, jobDescription: string, ragContext?: RagContext): string {
    const skills = profile.skills.length > 0 
      ? profile.skills.join(', ') 
      : 'various technical skills';

    const experience = profile.experienceYrs 
      ? `${profile.experienceYrs} years of experience` 
      : 'extensive experience';

    const title = profile.title || 'Freelancer';

    // Build portfolio context with relevance filtering
    let portfolioContext = '';
    if (profile.portfolio && profile.portfolio.length > 0) {
      const relevantPortfolios = this.filterRelevantPortfolios(profile.portfolio, jobDescription);
      if (relevantPortfolios.length > 0) {
        const portfolioItems = relevantPortfolios
          .slice(0, 3) // Top 3 most relevant
          .map(item => `- ${item.title}${item.description ? ': ' + item.description : ''}`)
          .join('\n');
        portfolioContext = `\n\nRELEVANT PROJECTS:\n${portfolioItems}`;
      }
    }

    // Build work history context with relevance filtering
    let workHistoryContext = '';
    if (profile.workHistory && profile.workHistory.length > 0) {
      const relevantWork = this.filterRelevantWorkHistory(profile.workHistory, jobDescription);
      if (relevantWork.length > 0) {
        const workItems = relevantWork
          .slice(0, 3) // Top 3 most relevant
          .map(item => `- ${item.title}${item.dates ? ' (' + item.dates + ')' : ''}`)
          .join('\n');
        workHistoryContext = `\n\nRECENT WORK:\n${workItems}`;
      }
    }

    const overview = profile.bio || `I'm a ${title} with ${experience} specializing in ${skills}.`;

    // Build RAG context section
    let ragContextSection = '';
    if (ragContext && ragContext.totalRetrieved > 0) {
      ragContextSection = this.formatRagContextForPrompt(ragContext);
    }

    return `${ragContextSection}

YOUR PROFILE (AUTHORITATIVE - USE THIS):
Title: ${title}
Overview: ${overview}
Skills: ${skills}
Experience: ${experience}${portfolioContext}${workHistoryContext}

JOB DESCRIPTION (THE CLIENT'S NEEDS):
${jobDescription}

TASK:
Write a compelling job proposal that:
1. Shows you understand the client's needs from the job description
2. Explains why you're a great fit using ONLY your actual skills and experience from YOUR PROFILE
3. Highlights relevant past work if applicable
4. Demonstrates your approach to solving their problem
5. Uses inspiration from reference examples (if provided) for structure and tone, but writes original content
6. Ends with a clear next step

Write the proposal now:`;
  }

  /**
   * Filter and rank portfolio items by relevance to job description
   */
  private filterRelevantPortfolios(
    portfolios: any[],
    jobDescription: string
  ): any[] {
    const jobLower = jobDescription.toLowerCase();
    
    // Score each portfolio item
    const scored = portfolios.map(portfolio => {
      let score = 0;
      
      // Check title relevance
      if (portfolio.title) {
        const titleWords = portfolio.title.toLowerCase().split(/\s+/);
        titleWords.forEach((word: string) => {
          if (word.length > 3 && jobLower.includes(word)) {
            score += 3;
          }
        });
      }
      
      // Check description relevance
      if (portfolio.description) {
        const descWords = portfolio.description.toLowerCase().split(/\s+/);
        descWords.forEach((word: string) => {
          if (word.length > 3 && jobLower.includes(word)) {
            score += 1;
          }
        });
      }
      
      // Check skills match
      if (portfolio.skills && Array.isArray(portfolio.skills)) {
        portfolio.skills.forEach((skill: string) => {
          if (jobLower.includes(skill.toLowerCase())) {
            score += 5; // Skills are most important
          }
        });
      }
      
      return { ...portfolio, relevanceScore: score };
    });
    
    // Sort by relevance score (highest first) and filter out zero scores
    return scored
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Filter and rank work history by relevance to job description
   */
  private filterRelevantWorkHistory(
    workHistory: any[],
    jobDescription: string
  ): any[] {
    const jobLower = jobDescription.toLowerCase();
    
    // Score each work history item
    const scored = workHistory.map(work => {
      let score = 0;
      
      // Check title relevance
      if (work.title) {
        const titleWords = work.title.toLowerCase().split(/\s+/);
        titleWords.forEach((word: string) => {
          if (word.length > 3 && jobLower.includes(word)) {
            score += 3;
          }
        });
      }
      
      // Check company relevance
      if (work.company) {
        const companyWords = work.company.toLowerCase().split(/\s+/);
        companyWords.forEach((word: string) => {
          if (word.length > 3 && jobLower.includes(word)) {
            score += 2;
          }
        });
      }
      
      // Check description relevance
      if (work.description) {
        const descWords = work.description.toLowerCase().split(/\s+/);
        descWords.forEach((word: string) => {
          if (word.length > 3 && jobLower.includes(word)) {
            score += 1;
          }
        });
      }
      
      return { ...work, relevanceScore: score };
    });
    
    // Sort by relevance score (highest first) and filter out zero scores
    return scored
      .filter(w => w.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private formatRagContextForPrompt(ragContext: RagContext): string {
    const sections: string[] = ['CONTEXT (REFERENCE MATERIAL - FOR INSPIRATION ONLY):'];

    // Add proposal examples
    if (ragContext.proposalExamples.length > 0) {
      sections.push('\nSuccessful Proposal Examples:');
      ragContext.proposalExamples.forEach((example, index) => {
        sections.push(`\nExample ${index + 1} (Score: ${example.score?.toFixed(2) || 'N/A'}):`);
        sections.push(example.content);
      });
    }

    // Add writing templates
    if (ragContext.writingTemplates.length > 0) {
      sections.push('\n\nWriting Structure Templates:');
      ragContext.writingTemplates.forEach((template) => {
        const section = template.metadata.section || 'general';
        sections.push(`\n${section.toUpperCase()}:`);
        sections.push(template.content);
      });
    }

    sections.push('\n---\n');

    return sections.join('\n');
  }

  buildPrompt(
    profile: Profile, 
    jobDescription: string, 
    ragContext?: RagContext
  ): { 
    system: string; 
    user: string;
    metadata: {
      preferencesUsed: {
        tone?: string;
        writingStyle?: string;
        length?: string;
      };
      portfoliosUsed: any[];
      workHistoryUsed: any[];
    };
  } {
    // Extract preferences
    const tonePreference = profile.preferences?.find(p => p.category === 'TONE');
    const stylePreference = profile.preferences?.find(p => p.category === 'WRITING_STYLE');
    const lengthPreference = profile.preferences?.find(p => p.category === 'LENGTH');

    // Filter relevant items
    const relevantPortfolios = profile.portfolio && profile.portfolio.length > 0
      ? this.filterRelevantPortfolios(profile.portfolio, jobDescription).slice(0, 3)
      : [];

    const relevantWork = profile.workHistory && profile.workHistory.length > 0
      ? this.filterRelevantWorkHistory(profile.workHistory, jobDescription).slice(0, 3)
      : [];

    return {
      system: this.buildSystemPrompt(profile),
      user: this.buildUserPrompt(profile, jobDescription, ragContext),
      metadata: {
        preferencesUsed: {
          tone: tonePreference?.value || profile.tone || 'professional',
          writingStyle: stylePreference?.value || profile.writingStyle || 'clear and concise',
          length: lengthPreference?.value || 'medium',
        },
        portfoliosUsed: relevantPortfolios.map(p => ({
          id: p.id,
          title: p.title,
          relevanceScore: p.relevanceScore,
        })),
        workHistoryUsed: relevantWork.map(w => ({
          id: w.id,
          title: w.title,
          relevanceScore: w.relevanceScore,
        })),
      },
    };
  }
}
