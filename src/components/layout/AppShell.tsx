import type { ReactNode } from 'react';
import {
  FilePlus2,
  History,
  Moon,
  Settings,
  Sun,
  Youtube,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
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

const sidebarVariants = {
  open: { width: 320 },
  closed: { width: 0 },
};

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>
        <motion.button
          type="button"
          onClick={onClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'rounded-lg p-2 transition-colors',
            active
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
          )}
          aria-label={label}
        >
          {children}
        </motion.button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-50 rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
        >
          {label}
          <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
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
    <Tooltip.Provider>
      <div className="relative flex h-screen flex-col overflow-hidden text-gray-900 dark:text-gray-100">
        {/* Ambient gradient + glow blobs */}
        <div className="ambient-bg">
          <div
            className="ambient-blob bg-indigo-400/40 dark:bg-indigo-500/20"
            style={{ top: '-10%', left: '-5%', width: 420, height: 420, animation: 'blob 14s ease-in-out infinite' }}
          />
          <div
            className="ambient-blob bg-violet-400/40 dark:bg-violet-500/20"
            style={{ top: '30%', right: '-8%', width: 460, height: 460, animation: 'blob 18s ease-in-out infinite reverse' }}
          />
          <div
            className="ambient-blob bg-cyan-400/30 dark:bg-cyan-500/20"
            style={{ bottom: '-12%', left: '30%', width: 420, height: 420, animation: 'blob 16s ease-in-out infinite' }}
          />
        </div>

        {/* Top bar */}
        <header className="glass z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200/70 px-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <IconButton
              label="Toggle transcript sidebar"
              onClick={onToggleLeftSidebar}
            >
              <Youtube className="h-5 w-5" />
            </IconButton>
            <div className="flex items-center gap-2.5">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow-primary text-white"
              >
                <Youtube className="h-5 w-5" />
              </motion.div>
              <h1 className="text-lg font-semibold tracking-tight">
                <span className="text-gradient">Transcript</span>
                <span className="text-gray-900 dark:text-gray-100"> Summarizer</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onNewTranscript && (
              <motion.button
                type="button"
                onClick={onNewTranscript}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="mr-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50/70 dark:text-brand-400 dark:hover:bg-gray-800/70"
                aria-label="Start a new session with a new transcript"
                title="New transcript"
              >
                <FilePlus2 className="h-4 w-4" />
                <span className="hidden sm:inline">New transcript</span>
              </motion.button>
            )}
            <IconButton label="Toggle history" active={historyOpen} onClick={onToggleHistory}>
              <History className="h-5 w-5" />
            </IconButton>
            <IconButton label="Toggle theme" onClick={onToggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </IconButton>
            <IconButton label="Open settings" onClick={onOpenSettings}>
              <Settings className="h-5 w-5" />
            </IconButton>
          </div>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {/* Left sidebar (transcript) */}
          <AnimatePresence initial={false}>
            {leftSidebarOpen && (
              <motion.aside
                key="left-sidebar"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="glass shrink-0 overflow-hidden border-r border-gray-200/70 dark:border-white/10"
              >
                <div className="h-full overflow-y-auto p-3">{leftSidebar}</div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main content */}
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>

          {/* Right sidebar (history) */}
          <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.aside
                key="right-sidebar"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="glass shrink-0 overflow-hidden border-l border-gray-200/70 dark:border-white/10"
              >
                <div className="h-full overflow-y-auto p-3">{rightSidebar}</div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
