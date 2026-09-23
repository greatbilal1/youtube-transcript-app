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

/**
 * Yield complete lines from a response body as they arrive, holding a partial
 * line back until the rest of it shows up in a later chunk. SSE and NDJSON both
 * need exactly this, and the buffering is the easy part to get wrong, so it
 * lives in one place rather than in each client's stream loop.
 *
 * A trailing line that never gets its newline is not emitted; both providers
 * terminate every event with one.
 */
export async function* readLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    yield* lines;
  }
}
