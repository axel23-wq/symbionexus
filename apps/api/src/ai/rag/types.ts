export interface CodeChunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  metadata?: Record<string, any>;
}

export interface RetrievalResult {
  filePath: string;
  content: string;
  similarity?: number;
  startLine: number;
  endLine: number;
}
