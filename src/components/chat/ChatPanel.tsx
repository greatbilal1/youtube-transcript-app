import { MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  isRTL?: boolean;
  onTimestampClick: (seconds: number) => void;
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
  isRTL,
  onTimestampClick,
}: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <MessageSquare className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <h2 className="text-lg font-semibold">Chat</h2>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Strict context
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          isRTL={isRTL}
          onTimestampClick={onTimestampClick}
        />
      </div>

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={disabled}
      />
    </div>
  );
}
