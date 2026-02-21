export interface Profile {
  id: string;
  name?: string;
  title?: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  experienceYrs?: number;
  location?: string;
  country?: string;
  city?: string;
  avatar?: string;
  tone?: string; // Deprecated - use preferences
  writingStyle?: string; // Deprecated - use preferences
  preferences?: AIPreference[]; // New dynamic preferences
  portfolio?: PortfolioItem[];
  workHistory?: WorkHistoryItem[];
  totalEarnings?: string;
  totalJobs?: string;
  totalHours?: string;
}

export interface AIPreference {
  id: string;
  category: 'TONE' | 'WRITING_STYLE' | 'LENGTH';
  name: string;
  value: string;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  type?: string; // 'CUSTOM' | 'UPWORK_IMPORT'
  title: string;
  description?: string;
  role?: string;
  skills: string[];
  url?: string;
}

export interface WorkHistoryItem {
  id: string;
  title: string;
  company?: string;
  dates?: string;
  totalEarned?: string;
  hours?: string;
  hourlyRate?: string;
  description?: string;
}
