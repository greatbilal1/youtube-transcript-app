import type { ReactNode } from 'react';
import { FilePlus2, History, Moon, Settings, Sun, Youtube } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AppShellProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onToggleHistory: () => void;
  historyOpen: boolean;
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
  onNewTranscript?: () => void;
  children: ReactNode;
}

export function AppShell({
  theme,
  onToggleTheme,
  onOpenSettings,
  onToggleHistory,
  historyOpen,
  leftSidebarOpen,
  onToggleLeftSidebar,
  leftSidebar,
  rightSidebar,
  onNewTranscript,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLeftSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle transcript sidebar"
          >
            <Youtube className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg font-semibold">Transcript Summarizer</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onNewTranscript && (
            <button
              onClick={onNewTranscript}
              className="mr-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-gray-800"
              aria-label="Start a new session with a new transcript"
              title="New transcript"
            >
              <FilePlus2 className="h-4 w-4" />
              <span className="hidden sm:inline">New transcript</span>
            </button>
          )}
          <button
            onClick={onToggleHistory}
            className={cn(
              'rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800',
              historyOpen
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400',
            )}
            aria-label="Toggle history"
          >
            <History className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar (transcript) */}
        <aside
          className={cn(
            'shrink-0 border-r border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-900',
            leftSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0',
          )}
        >
          {leftSidebarOpen && <div className="h-full overflow-y-auto">{leftSidebar}</div>}
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>

        {/* Right sidebar (history) */}
        <aside
          className={cn(
            'shrink-0 border-l border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-900',
            historyOpen ? 'w-80' : 'w-0 overflow-hidden border-l-0',
          )}
        >
          {historyOpen && <div className="h-full overflow-y-auto">{rightSidebar}</div>}
        </aside>
      </div>
    </div>
  );
}
