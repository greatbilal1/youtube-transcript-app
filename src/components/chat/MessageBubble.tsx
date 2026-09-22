import { motion } from 'framer-motion';
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        dir={isRTL ? 'rtl' : undefined}
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-gradient-brand text-white shadow-glow-primary'
            : 'glass text-gray-800 dark:text-gray-100',
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
    </motion.div>
  );
}
