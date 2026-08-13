import { useCallback, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Transcript } from '../types';
import { cleanTranscript } from '../lib/cleaner/transcriptCleaner';
import { detectLanguage } from '../lib/language';
import { saveTranscript } from '../lib/storage/sessionStore';

/**
 * Current transcript state: ingestion, cleaning, and segment highlighting.
 */
export function useTranscript() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'cleaned'>('cleaned');

  /** Shared core: clean raw text and persist it as a transcript. */
  const ingestText = useCallback(async (rawText: string, title: string, fileName: string) => {
    const clean = cleanTranscript(rawText);
    const lang = detectLanguage(clean.cleanedText || rawText);
    const t: Transcript = {
      id: uuid(),
      title,
      fileName,
      rawText,
      cleanedText: clean.cleanedText,
      segments: clean.segments,
      hasTimestamps: clean.hasTimestamps,
      language: lang.code,
      isRTL: lang.isRTL,
      createdAt: Date.now(),
    };
    setTranscript(t);
    setHighlightedSegment(null);
    await saveTranscript(t);
    return t;
  }, []);

  /** Ingest a .txt file, clean it, and persist it. */
  const ingestFile = useCallback(async (file: File) => {
    const rawText = await file.text();
    const title = file.name.replace(/\.txt$/i, '') || 'Untitled transcript';
    return ingestText(rawText, title, file.name);
  }, [ingestText]);

  /** Ingest raw pasted transcript text. */
  const pasteTranscript = useCallback(
    async (text: string) => {
      return ingestText(text, 'Pasted transcript', 'pasted-transcript.txt');
    },
    [ingestText],
  );

  /** Load a transcript from history. */
  const loadTranscript = useCallback((t: Transcript) => {
    setTranscript(t);
    setHighlightedSegment(null);
  }, []);

  /** Highlight a segment by index, then clear after a delay. */
  const highlightSegment = useCallback((index: number) => {
    setHighlightedSegment(index);
    window.setTimeout(() => setHighlightedSegment(null), 2500);
  }, []);

  /** Clear the current transcript. */
  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setHighlightedSegment(null);
  }, []);

  // Auto-clear highlight after timeout.
  useEffect(() => {
    if (highlightedSegment === null) return;
    const t = window.setTimeout(() => setHighlightedSegment(null), 2500);
    return () => window.clearTimeout(t);
  }, [highlightedSegment]);

  return {
    transcript,
    highlightedSegment,
    viewMode,
    setViewMode,
    ingestFile,
    pasteTranscript,
    loadTranscript,
    highlightSegment,
    clearTranscript,
  };
}
