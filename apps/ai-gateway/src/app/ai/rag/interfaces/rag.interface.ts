export interface RagDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score?: number;
}

export interface ProposalExampleMetadata {
  tone: string;
  industry?: string;
  jobType?: string;
  seniority?: string;
}

export interface WritingTemplateMetadata {
  tone: string;
  section?: 'intro' | 'body' | 'closing' | 'objection' | 'general';
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
