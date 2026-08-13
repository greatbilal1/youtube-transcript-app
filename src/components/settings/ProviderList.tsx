import { Check } from 'lucide-react';
import type { ProviderConfig, ProviderId } from '../../types';
import { cn } from '../../utils/cn';

interface ProviderListProps {
  providers: Record<ProviderId, ProviderConfig>;
  activeId: ProviderId;
  onSelect: (id: ProviderId) => void;
}

export function ProviderList({ providers, activeId, onSelect }: ProviderListProps) {
  return (
    <div className="space-y-2">
      {(Object.keys(providers) as ProviderId[]).map((id) => {
        const p = providers[id];
        const active = id === activeId;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
              active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
            )}
          >
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {p.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {p.model || 'No model set'}
              </div>
            </div>
            {active && <Check className="h-5 w-5 text-brand-600 dark:text-brand-400" />}
          </button>
        );
      })}
    </div>
  );
}
