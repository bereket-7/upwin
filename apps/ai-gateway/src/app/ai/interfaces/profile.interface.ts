export interface Profile {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  skills: string[];
  hourlyRate?: number;
  experienceYrs?: number;
  tone?: string;
  writingStyle?: string;
  rawText?: string;
  portfolio?: PortfolioItem[];
  workHistory?: WorkHistoryItem[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  role?: string;
  skills: string[];
}

export interface WorkHistoryItem {
  id: string;
  title: string;
  dates?: string;
  totalEarned?: string;
  hours?: string;
}
