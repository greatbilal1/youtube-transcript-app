import { formatTimestamp } from '../../lib/timestamps';

interface TimestampChipProps {
  seconds: number;
  onClick: (seconds: number) => void;
}

/**
 * A clickable timestamp chip. Clicking it highlights the matching
 * segment in the transcript sidebar.
 */
export function TimestampChip({ seconds, onClick }: TimestampChipProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(seconds);
      }}
      className="mx-0.5 inline-block rounded bg-brand-100 px-1 py-0.5 font-mono text-[0.8em] text-brand-700 transition-colors hover:bg-brand-200 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900"
      title={`Jump to ${formatTimestamp(seconds)}`}
    >
      {formatTimestamp(seconds)}
    </button>
  );
}
