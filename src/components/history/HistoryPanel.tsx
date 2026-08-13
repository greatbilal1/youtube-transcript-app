import { History } from 'lucide-react';
import type { Session } from '../../types';
import { SearchBar } from './SearchBar';
import { SessionCard } from './SessionCard';
import { Spinner } from '../common/Spinner';

interface HistoryPanelProps {
  sessions: Session[];
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  onRestore: (session: Session) => void;
  onDelete: (id: string) => void;
}

export function HistoryPanel({
  sessions,
  query,
  onQueryChange,
  loading,
  onRestore,
  onDelete,
}: HistoryPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-semibold">History</h2>
        </div>
        <SearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {query ? 'No sessions match your search.' : 'No saved sessions yet.'}
          </p>
        ) : (
          sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
