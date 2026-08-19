import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, Session, Transcript } from '../types';
import { createLLMClient } from '../lib/llm/factory';
import { buildChatSystemPrompt } from '../lib/llm/prompts';
import { appendChatMessage } from '../lib/storage/sessionStore';

/**
 * Strict-context chat with the transcript.
 * The system prompt restricts the model to answering only from the file.
 */
export function useChat(
  transcript: Transcript | null,
  session: Session | null,
  settings: {
    activeProviderId: string;
    providers: Record<string, { baseUrl: string; apiKey: string; model: string }>;
    temperature: number;
    maxTokens: number;
  },
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Always-current copy of messages so callback identities can stay stable
  // across streamed updates without capturing a stale list.
  const messagesRef = useRef<ChatMessage[]>([]);
  const setMessagesBoth = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  // Tracks the active session id so restoring only happens when switching
  // sessions, not on every `session` object mutation (e.g. a concurrent
  // summary/mindmap update refreshing the parent).
  const activeSessionIdRef = useRef<string | null>(null);

  // Sync messages when a session is restored. This mirrors the guard in
  // useSummary: while a stream is in flight, `messages` is owned by the
  // streaming callback — never clobber it with the session's snapshot (which
  // is only persisted once the stream completes). Without this guard, a
  // session-refresh `setSession` landing mid- or post-stream can wipe the
  // just-received answer.
  useEffect(() => {
    if (isStreaming) return;

    const id = session?.id ?? null;
    if (id === activeSessionIdRef.current) return;
    activeSessionIdRef.current = id;

    if (session) {
      messagesRef.current = session.chatMessages;
      setMessages(session.chatMessages);
    } else {
      messagesRef.current = [];
      setMessages([]);
    }
  }, [session, isStreaming]);

  const sendMessage = useCallback(
    async (text?: string, targetSession?: Session | null) => {
      const content = (text ?? input).trim();
      if (!content || !transcript || isStreaming) return;

      const provider = settings.providers[settings.activeProviderId];
      if (!provider?.model) {
        setError('No active provider configured. Open Settings to configure one.');
        return;
      }

      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content,
        createdAt: Date.now(),
      };
      const assistantMsg: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      const nextMessages = [...messagesRef.current, userMsg];
      setMessagesBoth([...nextMessages, assistantMsg]);
      setInput('');
      setError(null);
      setIsStreaming(true);

      const client = createLLMClient(provider as never);
      const systemMsg: ChatMessage = {
        id: uuid(),
        role: 'system',
        content: buildChatSystemPrompt(transcript),
        createdAt: Date.now(),
      };

      // Wire up a fresh AbortController so Stop can cancel the request.
      abortRef.current = new AbortController();

      // Accumulates streamed tokens so a partial reply can be kept when the
      // user stops mid-stream.
      let partial = '';

      try {
        const full = await client.chatStream(
          [systemMsg, ...nextMessages],
          {
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            signal: abortRef.current.signal,
          },
          (token) => {
            // Track partial content so it can be persisted if aborted.
            partial = `${partial}${token}`;
            setMessagesBoth((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.id === assistantMsg.id) {
                copy[copy.length - 1] = { ...last, content: last.content + token };
              }
              return copy;
            });
          },
        );

        const finalMsg: ChatMessage = { ...assistantMsg, content: full };
        setMessagesBoth((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = finalMsg;
          return copy;
        });

        // Persist to session if available. Prefer the explicitly-passed
        // session (avoids the stale-closure bug where `session` is still null
        // right after a session is created).
        const persistTo = targetSession ?? session;
        if (persistTo) {
          let s = persistTo;
          s = await appendChatMessage(s, userMsg);
          s = await appendChatMessage(s, finalMsg);
        }
      } catch (e) {
        // If the user pressed Stop, keep the streamed-so-far reply rather
        // than deleting it or showing an error.
        if (e instanceof DOMException && e.name === 'AbortError') {
          setMessagesBoth((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.id === assistantMsg.id) {
              copy[copy.length - 1] = { ...last, content: partial };
            }
            return copy;
          });
          const persistTo = targetSession ?? session;
          if (persistTo && partial) {
            const finalMsg: ChatMessage = { ...assistantMsg, content: partial };
            let s = persistTo;
            s = await appendChatMessage(s, userMsg);
            await appendChatMessage(s, finalMsg);
          }
          return;
        }
        const msg = e instanceof Error ? e.message : 'Chat request failed.';
        setError(msg);
        setMessagesBoth((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [input, transcript, session, settings, isStreaming],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearChat = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
