import { v4 as uuid } from 'uuid';
import { db } from './db';
import type { ChatMessage, Session, Summary, Transcript } from '../../types';

/** Create a new transcript record. */
export async function saveTranscript(transcript: Transcript): Promise<void> {
  await db.transcripts.put(transcript);
}

/** Fetch a transcript by id. */
export async function getTranscript(id: string): Promise<Transcript | undefined> {
  return db.transcripts.get(id);
}

/** List all transcripts, newest first. */
export async function listTranscripts(): Promise<Transcript[]> {
  return db.transcripts.orderBy('createdAt').reverse().toArray();
}

/** Delete a transcript and its associated sessions/summaries. */
export async function deleteTranscript(id: string): Promise<void> {
  await db.transcripts.delete(id);
  await db.sessions.where('transcriptId').equals(id).delete();
  await db.summaries.where('transcriptId').equals(id).delete();
}

/** Get or create the session for a transcript. */
export async function getOrCreateSession(transcript: Transcript): Promise<Session> {
  const existing = await db.sessions.where('transcriptId').equals(transcript.id).first();
  if (existing) return existing;

  const now = Date.now();
  const session: Session = {
    id: uuid(),
    transcriptId: transcript.id,
    transcriptTitle: transcript.title,
    summaries: [],
    chatMessages: [],
    updatedAt: now,
    createdAt: now,
  };
  await db.sessions.put(session);
  return session;
}

/** Fetch a session by id. */
export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

/** Persist a session (full replace). */
export async function saveSession(session: Session): Promise<void> {
  session.updatedAt = Date.now();
  await db.sessions.put(session);
  // Keep the denormalized summaries table in sync.
  await db.summaries.bulkPut(session.summaries);
}

/** List all sessions, newest first. */
export async function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}

/** Search sessions by title or summary content. */
export async function searchSessions(query: string): Promise<Session[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listSessions();
  const all = await db.sessions.toArray();
  return all
    .filter((s) => {
      const titleMatch = s.transcriptTitle.toLowerCase().includes(q);
      const summaryMatch = s.summaries.some((sum) =>
        sum.content.toLowerCase().includes(q),
      );
      const chatMatch = s.chatMessages.some((m) =>
        m.content.toLowerCase().includes(q),
      );
      return titleMatch || summaryMatch || chatMatch;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Delete a session. */
export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

/** Append a chat message to a session and persist. */
export async function appendChatMessage(
  session: Session,
  message: ChatMessage,
): Promise<Session> {
  const updated: Session = {
    ...session,
    chatMessages: [...session.chatMessages, message],
  };
  await saveSession(updated);
  return updated;
}

/** Add or replace a summary in a session and persist. */
export async function upsertSummary(
  session: Session,
  summary: Summary,
): Promise<Session> {
  const others = session.summaries.filter((s) => s.id !== summary.id);
  const updated: Session = {
    ...session,
    summaries: [...others, summary],
  };
  await saveSession(updated);
  return updated;
}

/** Set the mindmap outline on a session and persist. */
export async function setMindmapOutline(
  session: Session,
  outline: string,
): Promise<Session> {
  const updated: Session = { ...session, mindmapOutline: outline };
  await saveSession(updated);
  return updated;
}

/** Set the semantic knowledge tree on a session and persist. */
export async function setKnowledgeTree(
  session: Session,
  tree: import('../../types/knowledgeMap').KnowledgeTree,
): Promise<Session> {
  const updated: Session = { ...session, knowledgeTree: tree };
  await saveSession(updated);
  return updated;
}
