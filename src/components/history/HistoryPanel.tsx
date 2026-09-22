import { History } from 'lucide-react';
import type { Session } from '../../types';
import { SearchBar } from './SearchBar';
import { SessionCard } from './SessionCard';
import { Spinner } from '../common/Spinner';
import { Stagger, StaggerItem } from '../common/motion';

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
      <div className="mb-3 rounded-xl border border-gray-200/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <History className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            History
          </h2>
        </div>
        <SearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-1">
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {query ? 'No sessions match your search.' : 'No saved sessions yet.'}
          </p>
        ) : (
          <Stagger className="space-y-2">
            {sessions.map((s) => (
              <StaggerItem key={s.id}>
                <SessionCard
                  session={s}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
