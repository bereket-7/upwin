import { Injectable } from '@nestjs/common';
import { Profile } from './interfaces/profile.interface';

@Injectable()
export class PromptBuilder {
  buildSystemPrompt(profile: Profile): string {
    const tone = profile.tone || 'professional';
    const writingStyle = profile.writingStyle || 'clear and concise';

    return `You are a professional freelancer writing a proposal for a job opportunity. Your writing must be:

TONE: ${tone}
STYLE: ${writingStyle}

CRITICAL RULES:
- Write naturally and conversationally, like a real human freelancer
- Avoid buzzwords, clichés, and obvious AI phrasing (e.g., "leverage", "cutting-edge", "game-changer")
- Be confident but not arrogant
- Show genuine interest in the project
- Reference specific job requirements naturally
- NEVER invent skills, experience, or projects not in your profile
- Keep it concise (300-500 words ideal)
- Focus on value you can deliver to the client
- End with a clear call to action

Your goal is to sound like a skilled professional who genuinely understands the client's needs and can deliver results.`;
  }

  buildUserPrompt(profile: Profile, jobDescription: string): string {
    const skills = profile.skills.length > 0 
      ? profile.skills.join(', ') 
      : 'various technical skills';

    const experience = profile.experienceYrs 
      ? `${profile.experienceYrs} years of experience` 
      : 'extensive experience';

    const title = profile.title || 'Freelancer';

    // Build portfolio context if available
    let portfolioContext = '';
    if (profile.portfolio && profile.portfolio.length > 0) {
      const portfolioItems = profile.portfolio
        .slice(0, 3)
        .map(item => `- ${item.title}${item.description ? ': ' + item.description : ''}`)
        .join('\n');
      portfolioContext = `\n\nRELEVANT PROJECTS:\n${portfolioItems}`;
    }

    // Build work history context if available
    let workHistoryContext = '';
    if (profile.workHistory && profile.workHistory.length > 0) {
      const workItems = profile.workHistory
        .slice(0, 3)
        .map(item => `- ${item.title}${item.dates ? ' (' + item.dates + ')' : ''}`)
        .join('\n');
      workHistoryContext = `\n\nRECENT WORK:\n${workItems}`;
    }

    // Include raw text if available (user's custom profile text)
    const rawTextContext = profile.rawText 
      ? `\n\nADDITIONAL CONTEXT:\n${profile.rawText}` 
      : '';

    const overview = profile.description || `I'm a ${title} with ${experience} specializing in ${skills}.`;

    return `Write a compelling job proposal based on the following:

YOUR PROFILE:
Title: ${title}
Overview: ${overview}
Skills: ${skills}
Experience: ${experience}${portfolioContext}${workHistoryContext}${rawTextContext}

JOB DESCRIPTION:
${jobDescription}

TASK:
Write a personalized proposal that:
1. Shows you understand the client's needs
2. Explains why you're a great fit (using ONLY your actual skills and experience)
3. Highlights relevant past work if applicable
4. Demonstrates your approach to solving their problem
5. Ends with a clear next step

Write the proposal now:`;
  }

  buildPrompt(profile: Profile, jobDescription: string): { system: string; user: string } {
    return {
      system: this.buildSystemPrompt(profile),
      user: this.buildUserPrompt(profile, jobDescription),
    };
  }
}
