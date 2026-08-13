import { FileText, MessageSquare, Network, Trash2 } from 'lucide-react';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
  onRestore: (session: Session) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionCard({ session, onRestore, onDelete }: SessionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={() => onRestore(session)}
        className="block w-full text-left"
        title="Restore session"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {session.transcriptTitle}
          </h3>
          <span className="shrink-0 text-xs text-gray-400">
            {formatDate(session.updatedAt)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {session.chatMessages.length}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {session.summaries.length}
          </span>
          {session.mindmapOutline && (
            <span className="flex items-center gap-1">
              <Network className="h-3.5 w-3.5" />
              Map
            </span>
          )}
        </div>
      </button>
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => onDelete(session.id)}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
          aria-label="Delete session"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
