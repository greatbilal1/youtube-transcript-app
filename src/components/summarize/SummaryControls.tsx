import { FileText, List, AlignLeft } from 'lucide-react';
import type { SummaryLength } from '../../types';
import { Button } from '../common/Button';
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
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = opt.length === selectedLength;
        return (
          <Button
            key={opt.length}
            variant={active ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onGenerate(opt.length)}
            disabled={disabled || isGenerating}
            className={cn(isGenerating && 'opacity-60')}
          >
            {opt.icon}
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
