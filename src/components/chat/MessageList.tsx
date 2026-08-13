import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { Spinner } from '../common/Spinner';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isRTL?: boolean;
  onTimestampClick: (seconds: number) => void;
}

export function MessageList({
  messages,
  isStreaming,
  isRTL,
  onTimestampClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ask questions about the transcript. The assistant will only answer
          using information from the file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isRTL={isRTL}
          onTimestampClick={onTimestampClick}
        />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 pl-2 text-gray-400">
          <Spinner size="sm" />
          <span className="text-xs">Thinking…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
