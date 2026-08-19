import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
          <motion.button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors',
              active
                ? 'border-brand-400/70 bg-brand-500/10 shadow-glow'
                : 'border-gray-200/70 bg-white/50 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]',
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
            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="grid h-6 w-6 place-items-center rounded-full bg-gradient-brand text-white shadow-glow-primary"
                >
                  <Check className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
