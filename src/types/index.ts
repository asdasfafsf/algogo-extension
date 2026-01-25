export type Language = 'Node.js' | 'Python' | 'Java' | 'C++';

export type Source = 'BOJ';

export interface SubmitRequest {
  code: string;
  language: Language;
  problemId: string;
}

export interface SubmitResult {
  success: boolean;
  message: string;
  submissionId?: string;
}

export interface JudgeProgress {
  status: string;
  progress: number;
  memory?: string;
  time?: string;
  isComplete: boolean;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  languageMapping: Record<Language, string>;
}
