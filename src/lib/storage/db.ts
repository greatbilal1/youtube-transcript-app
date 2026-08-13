import Dexie, { type Table } from 'dexie';
import type { Session, Summary, Transcript } from '../../types';

/**
 * IndexedDB schema via Dexie.
 * - transcripts: raw + cleaned transcript content
 * - sessions: aggregate of chat + summaries + mindmap per transcript
 * - summaries: denormalized for fast history listing
 */
export class TranscriptDB extends Dexie {
  transcripts!: Table<Transcript, string>;
  sessions!: Table<Session, string>;
  summaries!: Table<Summary, string>;

  constructor() {
    super('youtube-transcript-app');
    this.version(1).stores({
      transcripts: 'id, createdAt, title',
      sessions: 'id, transcriptId, updatedAt, createdAt',
      summaries: 'id, transcriptId, createdAt',
    });
  }
}

export const db = new TranscriptDB();
