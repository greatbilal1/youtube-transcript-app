import type { ChatMessage, ProviderConfig } from '../../types';
import type { ChatOptions, LLMClient } from './client';
import { readLines, toWireMessage } from './client';

/**
 * Ollama client using the /api/chat endpoint.
 * No auth header is sent (Ollama is localhost).
 */
export class OllamaClient implements LLMClient {
  private baseUrl: string;
  private model: string;

  constructor(provider: ProviderConfig) {
    this.baseUrl = provider.baseUrl.replace(/\/+$/, '');
    this.model = provider.model;
  }

  private get endpoint(): string {
    return `${this.baseUrl}/api/chat`;
  }

  private body(messages: ChatMessage[], opts: ChatOptions, stream: boolean) {
    return {
      model: this.model,
      messages: messages.map(toWireMessage),
      options: {
        temperature: opts.temperature,
        num_predict: opts.maxTokens,
      },
      stream,
    };
  }

  async chat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.body(messages, opts, false)),
      signal: opts.signal,
    });
    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const content = data?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected response shape from Ollama.');
    }
    return content;
  }

  async chatStream(
    messages: ChatMessage[],
    opts: ChatOptions,
    onToken: (token: string) => void,
  ): Promise<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.body(messages, opts, true)),
      signal: opts.signal,
    });
    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }
    if (!res.body) {
      throw new Error('Streaming not supported by Ollama.');
    }

    let full = '';
    // Ollama streams NDJSON: one JSON object per line, terminated by `done`.
    for await (const line of readLines(res.body)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json?.message?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          full += delta;
          onToken(delta);
        }
        if (json?.done) {
          return full;
        }
      } catch {
        // Ignore malformed chunks.
      }
    }

    return full;
  }
}
