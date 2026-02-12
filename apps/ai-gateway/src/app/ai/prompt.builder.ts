import { Injectable } from '@nestjs/common';
import { Profile } from './interfaces/profile.interface';
import { RagContext } from './rag/interfaces/rag.interface';

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

IMPORTANT: Reference examples and templates are provided for INSPIRATION ONLY. They show structure and tone, but you must write original content based on YOUR profile and THIS specific job.

Your goal is to sound like a skilled professional who genuinely understands the client's needs and can deliver results.`;
  }

  buildUserPrompt(profile: Profile, jobDescription: string, ragContext?: RagContext): string {
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
Experience: ${experience}${portfolioContext}${workHistoryContext}${rawTextContext}

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
  ): { system: string; user: string } {
    return {
      system: this.buildSystemPrompt(profile),
      user: this.buildUserPrompt(profile, jobDescription, ragContext),
    };
  }
}
