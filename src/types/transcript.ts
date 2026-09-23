/** A single transcript segment, optionally carrying a timestamp. */
export interface Segment {
  text: string;
  start?: number;
  end?: number;
}

/** A parsed and cleaned transcript. */
export interface Transcript {
  id: string;
  title: string;
  fileName: string;
  rawText: string;
  cleanedText: string;
  segments: Segment[];
  hasTimestamps: boolean;
  /** Detected language tag, e.g. 'ar', 'en', 'unknown'. */
  language?: string;
  /** Whether the transcript should be rendered right-to-left. */
  isRTL?: boolean;
  createdAt: number;
}
