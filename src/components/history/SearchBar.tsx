import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search sessions…"
        className="w-full rounded-xl border border-gray-300/80 bg-white/60 py-2 pl-9 pr-3 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100"
      />
    </div>
  );
}
