import type { ChatMessage } from '../../types';

export interface ChatOptions {
  temperature: number;
  maxTokens: number;
  /** Optional AbortSignal to cancel an in-flight request, e.g. Stop streaming. */
  signal?: AbortSignal;
}

/** Unified interface for all LLM providers. */
export interface LLMClient {
  chat(messages: ChatMessage[], opts: ChatOptions): Promise<string>;
  chatStream(
    messages: ChatMessage[],
    opts: ChatOptions,
    onToken: (token: string) => void,
  ): Promise<string>;
}

/** Normalize a ChatMessage into the wire format used by OpenAI-compatible APIs. */
export function toWireMessage(msg: ChatMessage): {
  role: string;
  content: string;
} {
  return { role: msg.role, content: msg.content };
}
