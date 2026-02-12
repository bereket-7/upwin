export interface RagDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score?: number;
}

export interface ProposalExampleMetadata {
  jobType: string;
  industry: string;
  seniority: string;
  tone: string;
}

export interface WritingTemplateMetadata {
  section: 'intro' | 'body' | 'closing' | 'objection';
  tone: string;
}

export interface SearchResult {
  documents: RagDocument[];
  query: string;
  topK: number;
}

export interface RagContext {
  proposalExamples: RagDocument[];
  writingTemplates: RagDocument[];
  totalRetrieved: number;
}
