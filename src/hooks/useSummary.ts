import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Session, SettingsState, Summary, SummaryLength, Transcript } from '../types';
import {
  createLLMClient,
  NO_PROVIDER_ERROR,
  resolveProvider,
} from '../lib/llm/factory';
import { buildSummaryPrompt } from '../lib/llm/prompts';
import { upsertSummary } from '../lib/storage/sessionStore';

/**
 * Summary generation state. Produces concise/normal/detailed summaries,
 * persists them to the active session, and restores already-generated
 * summaries when switching sessions or lengths (no redundant regeneration).
 */
export function useSummary(
  transcript: Transcript | null,
  session: Session | null,
  settings: SettingsState,
) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedLength, setSelectedLength] = useState<SummaryLength>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks the active session id so the restore effect only re-derives state
  // when switching sessions, and never during an in-progress generation (which
  // owns `summary` via streaming) nor on unrelated `session` object refreshes
  // from concurrent operations. Length switching is already handled inside
  // `generate`, which shows the existing summary of the chosen length without
  // regenerating.
  const activeSessionIdRef = useRef<string | null>(null);

  // Restore the summary when a session is loaded/switched.
  useEffect(() => {
    // Streaming owns `summary`; don't interfere.
    if (isGenerating) return;

    const id = session?.id ?? null;
    // Same active session — don't restore. This effect also fires when the
    // generation itself ends and when the parent refreshes the session, and the
    // `session` object in hand is the copy captured *before* the new summary was
    // persisted, so re-deriving here would drop the summary that was just
    // streamed. `generate` claims the session id up front so this guard
    // recognises it.
    if (id === activeSessionIdRef.current) return;
    activeSessionIdRef.current = id;

    if (!session) {
      setSummary(null);
      return;
    }
    const existing = session.summaries.find((s) => s.length === selectedLength);
    setSummary(existing ?? null);
  }, [session, selectedLength, isGenerating]);

  const generate = useCallback(
    async (length: SummaryLength, targetSession?: Session | null) => {
      if (!transcript) {
        setError('No transcript loaded.');
        return;
      }
      const provider = resolveProvider(settings);
      if (!provider) {
        setError(NO_PROVIDER_ERROR);
        return;
      }

      setSelectedLength(length);

      // If a summary of this length already exists, just show it — don't
      // regenerate. Prefer the explicitly-passed session (avoids the
      // stale-closure bug where `session` is still null after creation).
      const persistTo = targetSession ?? session;
      // Claim the session here, before any await: when the session is created
      // and the generation starts in the same commit, the restore effect never
      // observes them separately, so this is the only chance to record which
      // session `summary` belongs to.
      if (persistTo) activeSessionIdRef.current = persistTo.id;
      const existing = persistTo?.summaries.find((s) => s.length === length);
      if (existing) {
        setSummary(existing);
        setError(null);
        return persistTo;
      }

      setIsGenerating(true);
      setError(null);

      const client = createLLMClient(provider);
      const userMsg = {
        id: uuid(),
        role: 'user' as const,
        content: buildSummaryPrompt(transcript, length),
        createdAt: Date.now(),
      };

      // The summary is created up-front with a stable id so streamed tokens
      // can accumulate into it and the final persisted object reuses it.
      const s: Summary = {
        id: uuid(),
        transcriptId: transcript.id,
        length,
        content: '',
        createdAt: Date.now(),
      };
      setSummary(s);

      // Local accumulator mirrors the streamed content so the persisted copy
      // is always complete regardless of React batching of the setState calls.
      let full = '';
      const opts = {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      };

      try {
        // Stream tokens into the visible summary so it renders progressively
        // (feels fast like chat) instead of appearing all at once.
        await client.chatStream([userMsg], opts, (token) => {
          full += token;
          setSummary((prev) =>
            prev ? { ...prev, content: prev.content + token } : prev,
          );
        });

        const final: Summary = { ...s, content: full };
        setSummary(final);
        if (persistTo) {
          return upsertSummary(persistTo, final);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Summary generation failed.');
        // Don't leave a partial summary showing after a failure.
        setSummary(null);
      } finally {
        setIsGenerating(false);
      }
    },
    [transcript, session, settings],
  );

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return { summary, selectedLength, isGenerating, error, generate, clearSummary };
}
