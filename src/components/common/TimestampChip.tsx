import { motion } from 'framer-motion';
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
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(seconds);
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="mx-0.5 inline-block rounded-md bg-brand-100 px-1.5 py-0.5 font-mono text-[0.8em] text-brand-700 shadow-sm transition-shadow hover:shadow-glow dark:bg-brand-400/15 dark:text-brand-300"
      title={`Jump to ${formatTimestamp(seconds)}`}
    >
      {formatTimestamp(seconds)}
    </motion.button>
  );
}
