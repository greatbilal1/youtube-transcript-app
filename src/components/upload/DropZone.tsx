import { useCallback, useRef, useState } from 'react';
import { ClipboardPaste, FileUp, UploadCloud, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass flex flex-col gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors',
        dragging
          ? 'border-brand-400 bg-brand-500/10 shadow-glow'
          : 'border-gray-300/80 dark:border-white/15',
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
      <motion.div
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl p-4"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={dragging ? { y: -6, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className={cn(
            'grid h-16 w-16 place-items-center rounded-2xl',
            dragging
              ? 'bg-gradient-brand text-white shadow-glow-primary'
              : 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
          )}
        >
          {dragging ? <UploadCloud className="h-10 w-10" /> : <FileUp className="h-10 w-10" />}
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Drag &amp; drop a transcript file here
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            or click to browse — .txt files only
          </p>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200/70 dark:bg-white/10" />
        <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
        <span className="h-px flex-1 bg-gray-200/70 dark:bg-white/10" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!pasteOpen ? (
          <motion.button
            key="paste-toggle"
            type="button"
            onClick={() => {
              setPasteOpen(true);
              setError(null);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste a transcript instead
          </motion.button>
        ) : (
          <motion.div
            key="paste-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the full transcript text here…"
                rows={6}
                className="w-full resize-none rounded-xl border border-gray-300/80 bg-white/70 p-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:focus:border-brand-400"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.p>
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
                  <motion.button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pasteText.trim()}
                    whileHover={pasteText.trim() ? { scale: 1.03 } : undefined}
                    whileTap={pasteText.trim() ? { scale: 0.96 } : undefined}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-sm font-medium text-white shadow-glow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Load transcript
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
}
