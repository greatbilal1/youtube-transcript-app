import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, Transcript } from '../types';
import {
  deleteSession,
  getOrCreateSession,
  listSessions,
  searchSessions,
} from '../lib/storage/sessionStore';

/**
 * History browsing, search, and session restore.
 * Search is debounced so typing doesn't re-query IndexedDB on every keystroke.
 */
export function useHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  // Always-current query so the stable `refresh` callback doesn't need to
  // re-enter its dependency array.
  const queryRef = useRef('');

  const refresh = useCallback(async () => {
    const q = queryRef.current;
    setLoading(true);
    try {
      const data = q ? await searchSessions(q) : await listSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search-as-you-type, then refresh. Loading the full list (e.g. on
  // mount, or after clearing the query) fires immediately.
  useEffect(() => {
    queryRef.current = query;
    if (!query) {
      refresh();
      return;
    }
    const t = window.setTimeout(refresh, 250);
    return () => window.clearTimeout(t);
  }, [query, refresh]);

  const removeSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await refresh();
    },
    [refresh],
  );

  const createSessionFor = useCallback(async (transcript: Transcript) => {
    return getOrCreateSession(transcript);
  }, []);

  return {
    sessions,
    query,
    setQuery,
    loading,
    refresh,
    removeSession,
    createSessionFor,
  };
}
