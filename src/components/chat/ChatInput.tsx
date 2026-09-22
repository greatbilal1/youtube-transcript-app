import { Send, Square } from 'lucide-react';
import { Button } from '../common/Button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-gray-200/70 bg-white/60 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.02]">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the transcript…"
        rows={1}
        disabled={disabled}
        className="max-h-40 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-300/80 bg-white/70 px-3 py-2 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100"
      />
      {isStreaming ? (
        <Button variant="danger" size="md" onClick={onStop}>
          <Square className="h-4 w-4" />
          Stop
        </Button>
      ) : (
        <Button onClick={onSend} disabled={disabled || !value.trim()}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      )}
    </div>
  );
}
