import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSummary } from '../src/hooks/useSummary';
import type { Session, SettingsState, Summary, Transcript } from '../src/types';

// Only the client is stubbed; the provider helpers keep their real behaviour so
// the hook's "no provider configured" path is exercised as written.
vi.mock('../src/lib/llm/factory', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/llm/factory')>()),
  createLLMClient: () => ({
    chat: async () => 'unused',
    chatStream: async (
      _messages: unknown,
      _opts: unknown,
      onToken: (t: string) => void,
    ) => {
      onToken('Hello');
      onToken(' world');
      return 'Hello world';
    },
  }),
}));

vi.mock('../src/lib/storage/sessionStore', () => ({
  upsertSummary: async (session: Session, summary: Summary) => ({
    ...session,
    summaries: [...session.summaries.filter((s) => s.id !== summary.id), summary],
  }),
}));

const transcript = { id: 't1', title: 'Test' } as unknown as Transcript;

const settings = {
  providers: {
    deepinfra: { id: 'deepinfra', label: 'DeepInfra', baseUrl: 'https://x', apiKey: 'k', model: 'm' },
  },
  activeProviderId: 'deepinfra',
  temperature: 0.3,
  maxTokens: 2048,
} as unknown as SettingsState;

function session(id: string, summaries: Summary[] = []): Session {
  return {
    id,
    transcriptId: 't1',
    transcriptTitle: 'Test',
    summaries,
    chatMessages: [],
    updatedAt: 0,
    createdAt: 0,
  };
}

describe('useSummary', () => {
  it('keeps the summary after generation when the session arrives in the same render', async () => {
    const s1 = session('S1');
    const { result, rerender } = renderHook(
      ({ session: current }: { session: Session | null }) =>
        useSummary(transcript, current, settings),
      { initialProps: { session: null as Session | null } },
    );

    // Mirrors App.handleGenerateSummary: the session is created and the
    // generation starts without an intervening render, so the hook sees the
    // new session and `isGenerating` for the first time in the same commit.
    await act(async () => {
      rerender({ session: s1 });
      await result.current.generate('normal', s1);
    });

    expect(result.current.summary?.content).toBe('Hello world');
  });

  it('still restores an existing summary when switching to another session', async () => {
    const existing: Summary = {
      id: 's-existing',
      transcriptId: 't1',
      length: 'detailed',
      content: 'Previously generated',
      createdAt: 0,
    };
    const s1 = session('S1');
    const s2 = session('S2', [existing]);

    const { result, rerender } = renderHook(
      ({ session: current }: { session: Session | null }) =>
        useSummary(transcript, current, settings),
      { initialProps: { session: s1 as Session | null } },
    );

    await act(async () => {
      rerender({ session: s2 });
    });
    await act(async () => {
      result.current.generate('detailed', s2);
    });

    expect(result.current.summary?.content).toBe('Previously generated');
  });
});
