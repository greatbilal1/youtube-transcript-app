import { useCallback, useRef, useState } from 'react';
import { ClipboardPaste, FileUp, UploadCloud, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DropZoneProps {
  onFile: (file: File) => void;
  onPasteText: (text: string) => void;
  disabled?: boolean;
}

/**
 * Drag-and-drop + file picker for .txt transcript files,
 * with an optional "paste your transcript" alternative.
 */
export function DropZone({ onFile, onPasteText, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.txt')) {
        setError('Please upload a .txt file.');
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  const handlePasteSubmit = useCallback(() => {
    const text = pasteText.trim();
    if (!text) {
      setError('Please paste some transcript text first.');
      return;
    }
    setError(null);
    onPasteText(text);
  }, [pasteText, onPasteText]);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900',
        disabled && 'pointer-events-none opacity-50',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg p-4 transition-colors hover:border-brand-400"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        {dragging ? (
          <UploadCloud className="h-12 w-12 text-brand-500" />
        ) : (
          <FileUp className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag & drop a transcript file here
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            or click to browse — .txt files only
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {!pasteOpen ? (
        <button
          type="button"
          onClick={() => {
            setPasteOpen(true);
            setError(null);
          }}
          className="mx-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
        >
          <ClipboardPaste className="h-4 w-4" />
          Paste a transcript instead
        </button>
      ) : (
        <div className="flex flex-col gap-2 text-left">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste the full transcript text here…"
            rows={6}
            className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-400"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {pasteText.length.toLocaleString()} characters
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPasteOpen(false);
                  setPasteText('');
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Load transcript
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
