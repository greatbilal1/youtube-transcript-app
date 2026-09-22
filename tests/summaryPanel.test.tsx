import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryPanel } from '../src/components/summarize/SummaryPanel';
import type { Summary, Transcript } from '../src/types';

const transcript = {
  id: 't1',
  title: 'Test',
  rawText: '',
  cleanedText: '',
  segments: [],
  hasTimestamps: false,
  createdAt: 0,
} as unknown as Transcript;

function summary(content: string): Summary {
  return { id: 's1', transcriptId: 't1', length: 'normal', content, createdAt: 0 };
}

function renderPanel(overrides: Partial<Parameters<typeof SummaryPanel>[0]> = {}) {
  const props = {
    transcript,
    summary: null,
    selectedLength: 'normal' as const,
    isGenerating: false,
    error: null,
    onGenerate: vi.fn(),
    onTimestampClick: vi.fn(),
    ...overrides,
  };
  return render(<SummaryPanel {...props} />);
}

describe('SummaryPanel visibility across the generation lifecycle', () => {
  it('tells the user to click a length before anything is generated', () => {
    renderPanel();
    // The prompt names each length in its own <span>, so read the whole block.
    const emptyState = screen.getByText(/No summary yet/i).parentElement;
    expect(emptyState?.textContent).toContain(
      'Click Concise, Normal, or Detailed above to generate one.',
    );
  });

  it('keeps the summary visible when generation finishes', () => {
    const { rerender } = renderPanel();

    const base = {
      transcript,
      selectedLength: 'normal' as const,
      error: null,
      onGenerate: vi.fn(),
      onTimestampClick: vi.fn(),
    };

    // Tokens arrive: summary present, still generating.
    rerender(<SummaryPanel {...base} summary={summary('Hello')} isGenerating />);
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Stream ends: isGenerating flips to false, content is final.
    rerender(<SummaryPanel {...base} summary={summary('Hello world')} isGenerating={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();

    // App refreshes the session from IndexedDB (new object, same content).
    rerender(<SummaryPanel {...base} summary={summary('Hello world')} isGenerating={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
