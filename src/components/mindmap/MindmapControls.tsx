import { Download, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface MindmapControlsProps {
  onGenerate: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  isGenerating: boolean;
  hasOutline: boolean;
  disabled?: boolean;
}

export function MindmapControls({
  onGenerate,
  onExportSvg,
  onExportPng,
  isGenerating,
  hasOutline,
  disabled,
}: MindmapControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onGenerate} disabled={disabled || isGenerating}>
        <RefreshCw className="h-4 w-4" />
        {isGenerating ? 'Generating…' : 'Generate Mindmap'}
      </Button>
      {hasOutline && (
        <>
          <Button variant="secondary" size="sm" onClick={onExportSvg}>
            <Download className="h-4 w-4" />
            Export SVG
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportPng}>
            <ImageIcon className="h-4 w-4" />
            Export PNG
          </Button>
        </>
      )}
    </div>
  );
}
