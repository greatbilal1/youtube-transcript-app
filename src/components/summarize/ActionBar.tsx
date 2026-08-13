import { Copy, Download } from 'lucide-react';
import { Button } from '../common/Button';

interface ActionBarProps {
  onCopy: () => void;
  onExport: () => void;
  disabled?: boolean;
}

/**
 * Action buttons for generated text: copy and export as .md.
 * Summaries are auto-saved to history on generation, so there is no
 * separate "save" action.
 */
export function ActionBar({ onCopy, onExport, disabled }: ActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onCopy} disabled={disabled}>
        <Copy className="h-4 w-4" />
        Copy
      </Button>
      <Button variant="secondary" size="sm" onClick={onExport} disabled={disabled}>
        <Download className="h-4 w-4" />
        Export .md
      </Button>
    </div>
  );
}
