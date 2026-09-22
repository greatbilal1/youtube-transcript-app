import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, SettingsState, Transcript } from '../types';
import { createLLMClient } from '../lib/llm/factory';
import { buildMindmapPrompt } from '../lib/llm/prompts';
import { dedupeOutline } from '../lib/llm/dedupeOutline';
import { setMindmapOutline } from '../lib/storage/sessionStore';

/**
 * Mindmap outline generation + markmap rendering state.
 */
export function useMindmap(
  transcript: Transcript | null,
  session: Session | null,
  settings: SettingsState,
) {
  const [outline, setOutline] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Tracks the active session id so the restore effect only re-syncs when
  // switching sessions — not on every `session` object mutation (e.g. a
  // concurrent summary update refreshing the parent). This keeps a mindmap
  // generation or already-shown outline from being wiped mid-flight.
  const activeSessionIdRef = useRef<string | null>(null);

  // Restore outline from session (dedupe in case it was saved before the
  // deduplication fix was added).
  useEffect(() => {
    const id = session?.id ?? null;
    // Skip re-derivation unless the session itself changed or a generation is
    // starting fresh after the session resolved.
    if (id === activeSessionIdRef.current && !isGenerating) return;
    activeSessionIdRef.current = id;

    if (session?.mindmapOutline) {
      setOutline(dedupeOutline(session.mindmapOutline));
    } else if (!isGenerating) {
      setOutline('');
    }
  }, [session, isGenerating]);

  const generate = useCallback(
    async (targetSession?: Session | null) => {
      if (!transcript) {
        setError('No transcript loaded.');
        return;
      }
      const provider = settings.providers[settings.activeProviderId];
      if (!provider?.model) {
        setError('No active provider configured. Open Settings to configure one.');
        return;
      }

      setIsGenerating(true);
      setError(null);

      const client = createLLMClient(provider);
      const userMsg = {
        id: 'mindmap',
        role: 'user' as const,
        content: buildMindmapPrompt(transcript),
        createdAt: Date.now(),
      };

      try {
        const raw = await client.chat([userMsg], {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        });
        // Collapse any repeated nodes the model may have produced (common
        // with non-English transcripts) before rendering/persisting.
        const content = dedupeOutline(raw);
        setOutline(content);
        // Prefer the explicitly-passed session (avoids the stale-closure bug
        // where `session` is still null right after a session is created).
        const persistTo = targetSession ?? session;
        if (persistTo) {
          const updated = await setMindmapOutline(persistTo, content);
          return updated;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mindmap generation failed.');
      } finally {
        setIsGenerating(false);
      }
    },
    [transcript, session, settings],
  );

  const clearMindmap = useCallback(() => {
    setOutline('');
    setError(null);
  }, []);

  return {
    outline,
    isGenerating,
    error,
    generate,
    clearMindmap,
    containerRef,
  };
}
