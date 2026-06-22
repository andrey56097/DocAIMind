/** DocMind — shared types */

export interface AppDocument {
  id: string;
  title: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  order: number;
}

export interface Source {
  id: string;
  title: string;
  file_path: string;
}

export interface UsageInfo {
  totalTokens: number;
  totalCost: string;
}

export interface AnswerResult {
  answer: string;
  sources: Source[];
  usage: UsageInfo;
}

export interface AppState {
  documents: AppDocument[];
  selectedDocumentIds: Set<string>;
  accumulatedUsage: { totalTokens: number; totalCost: number };
  questionCount: number;
  isLoading: boolean;
}
