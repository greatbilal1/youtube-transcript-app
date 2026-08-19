import { FileText, List, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SummaryLength } from '../../types';
import { cn } from '../../utils/cn';

interface SummaryControlsProps {
  onGenerate: (length: SummaryLength) => void;
  isGenerating: boolean;
  disabled?: boolean;
  selectedLength?: SummaryLength;
}

const OPTIONS: Array<{ length: SummaryLength; label: string; icon: React.ReactNode }> = [
  { length: 'concise', label: 'Concise', icon: <FileText className="h-4 w-4" /> },
  { length: 'normal', label: 'Normal', icon: <List className="h-4 w-4" /> },
  { length: 'detailed', label: 'Detailed', icon: <AlignLeft className="h-4 w-4" /> },
];

export function SummaryControls({
  onGenerate,
  isGenerating,
  disabled,
  selectedLength,
}: SummaryControlsProps) {
  return (
    <div className="glass inline-flex items-center gap-1 rounded-xl p-1">
      {OPTIONS.map((opt) => {
        const active = opt.length === selectedLength;
        return (
          <motion.button
            key={opt.length}
            type="button"
            onClick={() => onGenerate(opt.length)}
            disabled={disabled || isGenerating}
            whileHover={!disabled && !isGenerating ? { scale: 1.04 } : undefined}
            whileTap={!disabled && !isGenerating ? { scale: 0.95 } : undefined}
            className={cn(
              'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100',
              (disabled || isGenerating) && 'cursor-not-allowed opacity-60',
            )}
          >
            {active && (
              <motion.span
                layoutId="summary-length-pill"
                className="absolute inset-0 rounded-lg bg-gradient-brand shadow-glow-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
