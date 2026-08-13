import type { ChatMessage } from '../../types';
import { MarkdownContent } from '../common/MarkdownContent';
import { cn } from '../../utils/cn';

interface MessageBubbleProps {
  message: ChatMessage;
  isRTL?: boolean;
  onTimestampClick: (seconds: number) => void;
}

export function MessageBubble({ message, isRTL, onTimestampClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        dir={isRTL ? 'rtl' : undefined}
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-brand-600 text-white'
            : 'bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownContent
            content={message.content}
            onTimestampClick={onTimestampClick}
          />
        )}
      </div>
    </div>
  );
}
