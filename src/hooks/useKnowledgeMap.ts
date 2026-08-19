import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, Transcript } from '../types';
import type { KnowledgeTree } from '../types/knowledgeMap';
import { createLLMClient } from '../lib/llm/factory';
import {
  buildKnowledgeMapSystemPrompt,
  buildKnowledgeMapUserPrompt,
} from '../lib/llm/knowledgeMapPrompts';
import { parseKnowledgeTree } from '../lib/llm/knowledgeMapParser';
import { setKnowledgeTree } from '../lib/storage/sessionStore';

/**
 * Semantic knowledge-map state: generates a structured knowledge tree from a
 * transcript via the LLM, validates it, and persists it to the session.
 */
export function useKnowledgeMap(
  transcript: Transcript | null,
  session: Session | null,
  settings: {
    activeProviderId: string;
    providers: Record<string, { baseUrl: string; apiKey: string; model: string }>;
    temperature: number;
    maxTokens: number;
  },
) {
  const [tree, setTree] = useState<KnowledgeTree | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  // Restore tree from session.
  useEffect(() => {
    const id = session?.id ?? null;
    if (id === activeSessionIdRef.current && !isGenerating) return;
    activeSessionIdRef.current = id;

    if (session?.knowledgeTree) {
      setTree(session.knowledgeTree);
    } else if (!isGenerating) {
      setTree(null);
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

      const client = createLLMClient(provider as never);
      const messages = [
        { id: 'km-system', role: 'system' as const, content: buildKnowledgeMapSystemPrompt(), createdAt: Date.now() },
        { id: 'km-user', role: 'user' as const, content: buildKnowledgeMapUserPrompt(transcript), createdAt: Date.now() },
      ];

      try {
        const raw = await client.chat(messages, {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        });
        const parsed = parseKnowledgeTree(raw);
        setTree(parsed);
        const persistTo = targetSession ?? session;
        if (persistTo) {
          await setKnowledgeTree(persistTo, parsed);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Knowledge map generation failed.');
      } finally {
        setIsGenerating(false);
      }
    },
    [transcript, session, settings],
  );

  const updateTree = useCallback((next: KnowledgeTree) => {
    setTree(next);
    // Persist expansion/edits without blocking.
    if (session) {
      void setKnowledgeTree(session, next);
    }
  }, [session]);

  const clear = useCallback(() => {
    setTree(null);
    setError(null);
  }, []);

  return {
    tree,
    isGenerating,
    error,
    generate,
    updateTree,
    clear,
  };
}
