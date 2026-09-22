import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="glass inline-flex items-center gap-1 rounded-xl p-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tabs-pill"
                className="absolute inset-0 rounded-lg bg-gradient-brand shadow-glow-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
