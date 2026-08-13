export type SummaryLength = 'concise' | 'normal' | 'detailed';

export interface Summary {
  id: string;
  transcriptId: string;
  length: SummaryLength;
  content: string;
  createdAt: number;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

/** A persisted session aggregating summaries, chat, and mindmap for a transcript. */
export interface Session {
  id: string;
  transcriptId: string;
  transcriptTitle: string;
  summaries: Summary[];
  chatMessages: ChatMessage[];
  mindmapOutline?: string;
  updatedAt: number;
  createdAt: number;
}
