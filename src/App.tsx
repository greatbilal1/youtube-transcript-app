import { useCallback, useMemo, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageSquare, Network, History } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsModal } from './components/settings/SettingsModal';
import { DropZone } from './components/upload/DropZone';
import { SummaryPanel } from './components/summarize/SummaryPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { HistoryPanel } from './components/history/HistoryPanel';
import { Tabs } from './components/common/Tabs';
import { Spinner } from './components/common/Spinner';
import { ToastContainer, toast } from './components/common/Toast';
import { useSettings } from './hooks/useSettings';
import { useTranscript } from './hooks/useTranscript';
import { useChat } from './hooks/useChat';
import { useSummary } from './hooks/useSummary';
import { useMindmap } from './hooks/useMindmap';
import { useHistory } from './hooks/useHistory';
import { useTheme } from './hooks/useTheme';
import type { Session, Summary, Transcript } from './types';
import { getSession, getTranscript } from './lib/storage/sessionStore';

// The markmap chunk is large (~235 kB gzip). Lazy-load it so it's only
// fetched when the user actually opens the Mindmap tab.
const MindmapPanel = lazy(() =>
  import('./components/mindmap/MindmapPanel').then((m) => ({ default: m.MindmapPanel })),
);

type TabId = 'summarize' | 'mindmap' | 'history';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { settings, updateProvider, setActiveProvider, setTemperature, setMaxTokens } =
    useSettings();

  const transcriptHook = useTranscript();
  const { transcript, highlightedSegment, viewMode, setViewMode, ingestFile, pasteTranscript, loadTranscript, highlightSegment } =
    transcriptHook;

  const [session, setSession] = useState<Session | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('summarize');

  const chatHook = useChat(transcript, session, settings);
  const summaryHook = useSummary(transcript, session, settings);
  const mindmapHook = useMindmap(transcript, session, settings);
  const historyHook = useHistory();

  /** Fire a Sonner toast for a user-facing message. */
  const pushToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast.info(message);
  }, []);

  /** Ensure a session exists for the current transcript. */
  const ensureSession = useCallback(
    async (t: Transcript): Promise<Session | null> => {
      const s = await historyHook.createSessionFor(t);
      setSession(s);
      return s;
    },
    [historyHook],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const t = await ingestFile(file);
      setSession(null);
      setActiveTab('summarize');
      pushToast('success', `Loaded "${t.title}"`);
    },
    [ingestFile, pushToast],
  );

  const handlePasteText = useCallback(
    async (text: string) => {
      const t = await pasteTranscript(text);
      setSession(null);
      setActiveTab('summarize');
      pushToast('success', `Loaded "${t.title}"`);
    },
    [pasteTranscript, pushToast],
  );

  /** Start a brand-new session: clear the current transcript and all derived state. */
  const handleNewTranscript = useCallback(() => {
    transcriptHook.clearTranscript();
    setSession(null);
    setActiveTab('summarize');
    setLeftSidebarOpen(true);
    setHistoryOpen(false);
    summaryHook.clearSummary();
    chatHook.clearChat();
    mindmapHook.clearMindmap();
  }, [transcriptHook, summaryHook, chatHook, mindmapHook]);

  // Re-fetch the authoritative session from IndexedDB so concurrent
  // operations (summary / chat / mindmap) never overwrite each other's data
  // with a partial derivative returned by a single operation.
  const refreshSession = useCallback(async (id: string) => {
    const fresh = await getSession(id);
    if (fresh) setSession(fresh);
  }, []);

  const handleGenerateSummary = useCallback(
    async (length: Summary['length']) => {
      if (!transcript) return;
      const s = session ?? (await ensureSession(transcript));
      if (!s) return;
      await summaryHook.generate(length, s);
      // Refresh from DB so already-generated summaries and any concurrent
      // mindmap outline are preserved in memory.
      await refreshSession(s.id);
    },
    [transcript, session, ensureSession, summaryHook, refreshSession],
  );

  const handleSendChat = useCallback(async () => {
    if (!transcript) return;
    const s = session ?? (await ensureSession(transcript));
    if (!s) return;
    await chatHook.sendMessage(undefined, s);
    await refreshSession(s.id);
  }, [transcript, session, ensureSession, chatHook, refreshSession]);

  const handleGenerateMindmap = useCallback(async () => {
    if (!transcript) return;
    const s = session ?? (await ensureSession(transcript));
    if (!s) return;
    await mindmapHook.generate(s);
    // Refresh from DB so the mindmap outline is merged in alongside any
    // summary/chat that may have been added by a concurrent operation.
    await refreshSession(s.id);
  }, [transcript, session, ensureSession, mindmapHook, refreshSession]);

  /** Map a timestamp (seconds) to a transcript segment index and highlight it. */
  const handleTimestampClick = useCallback(
    (seconds: number) => {
      if (!transcript) return;
      const idx = transcript.segments.findIndex((seg) => {
        if (seg.start === undefined) return false;
        return seconds >= seg.start && (seg.end === undefined || seconds <= seg.end);
      });
      if (idx === -1) {
        pushToast('info', 'No matching segment for that timestamp.');
        return;
      }
      highlightSegment(idx);
      setLeftSidebarOpen(true);
      // Scroll the segment into view after a tick.
      setTimeout(() => {
        document.getElementById(`segment-${idx}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 50);
    },
    [transcript, highlightSegment, pushToast],
  );

  const handleRestoreSession = useCallback(
    async (s: Session) => {
      const t = await getTranscript(s.transcriptId);
      if (!t) {
        pushToast('error', 'The transcript for this session no longer exists.');
        return;
      }
      loadTranscript(t);
      setSession(s);
      setActiveTab('summarize');
      setHistoryOpen(false);
      pushToast('success', `Restored "${s.transcriptTitle}"`);
    },
    [loadTranscript, pushToast],
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await historyHook.removeSession(id);
      pushToast('info', 'Session deleted.');
    },
    [historyHook, pushToast],
  );

  const tabs = useMemo(
    () => [
      { id: 'summarize', label: 'Summarize & Chat', icon: <MessageSquare className="h-4 w-4" /> },
      { id: 'mindmap', label: 'Mindmap', icon: <Network className="h-4 w-4" /> },
      { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
    ],
    [],
  );

  return (
    <AppShell
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenSettings={() => setSettingsOpen(true)}
      onToggleHistory={() => setHistoryOpen((v) => !v)}
      historyOpen={historyOpen}
      leftSidebarOpen={leftSidebarOpen}
      onToggleLeftSidebar={() => setLeftSidebarOpen((v) => !v)}
      onNewTranscript={transcript ? handleNewTranscript : undefined}
      leftSidebar={
        <Sidebar
          transcript={transcript}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          highlightedSegment={highlightedSegment}
        />
      }
      rightSidebar={
        <HistoryPanel
          sessions={historyHook.sessions}
          query={historyHook.query}
          onQueryChange={historyHook.setQuery}
          loading={historyHook.loading}
          onRestore={handleRestoreSession}
          onDelete={handleDeleteSession}
        />
      }
    >
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 p-4">
        {!transcript ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow-primary"
              >
                <FileText className="h-8 w-8" />
              </motion.div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Upload a YouTube <span className="text-gradient">transcript</span>
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Drop a .txt transcript file to summarize, chat, and visualize it.
              </p>
            </motion.div>
            <div className="w-full max-w-xl">
              <DropZone onFile={handleFile} onPasteText={handlePasteText} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
              <span className="hidden truncate text-sm text-gray-500 sm:block dark:text-gray-400">
                {transcript.title}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'summarize' && (
                <motion.div
                  key="summarize"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2"
                >
                  <div className="glass min-h-0 overflow-y-auto rounded-2xl p-4">
                    <SummaryPanel
                      transcript={transcript}
                      summary={summaryHook.summary}
                      selectedLength={summaryHook.selectedLength}
                      isGenerating={summaryHook.isGenerating}
                      error={summaryHook.error}
                      onGenerate={handleGenerateSummary}
                      onTimestampClick={handleTimestampClick}
                    />
                  </div>
                  <div className="glass min-h-0 overflow-hidden rounded-2xl">
                    <ChatPanel
                      messages={chatHook.messages}
                      input={chatHook.input}
                      onInputChange={chatHook.setInput}
                      onSend={handleSendChat}
                      onStop={chatHook.stopStreaming}
                      isStreaming={chatHook.isStreaming}
                      isRTL={transcript?.isRTL}
                      onTimestampClick={handleTimestampClick}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'mindmap' && (
                <motion.div
                  key="mindmap"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="glass min-h-0 flex-1 overflow-hidden rounded-2xl"
                >
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <Spinner />
                      </div>
                    }
                  >
                    <MindmapPanel
                      transcript={transcript}
                      outline={mindmapHook.outline}
                      isGenerating={mindmapHook.isGenerating}
                      error={mindmapHook.error}
                      onGenerate={handleGenerateMindmap}
                    />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="glass min-h-0 flex-1 overflow-y-auto rounded-2xl p-4"
                >
                  <HistoryPanel
                    sessions={historyHook.sessions}
                    query={historyHook.query}
                    onQueryChange={historyHook.setQuery}
                    loading={historyHook.loading}
                    onRestore={handleRestoreSession}
                    onDelete={handleDeleteSession}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateProvider={updateProvider}
        onSetActive={setActiveProvider}
        onSetTemperature={setTemperature}
        onSetMaxTokens={setMaxTokens}
      />

      <ToastContainer />
    </AppShell>
  );
}
