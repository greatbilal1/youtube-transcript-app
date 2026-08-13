import type { ChatMessage, ProviderConfig } from '../../types';
import type { ChatOptions, LLMClient } from './client';
import { toWireMessage } from './client';

/**
 * OpenAI-compatible chat completions client.
 * Used for DeepInfra, OpenCode Zen, and custom endpoints.
 */
export class OpenAICompatibleClient implements LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(provider: ProviderConfig) {
    this.baseUrl = provider.baseUrl.replace(/\/+$/, '');
    this.apiKey = provider.apiKey;
    this.model = provider.model;
  }

  private get endpoint(): string {
    return `${this.baseUrl}/chat/completions`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      h['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return h;
  }

  private body(messages: ChatMessage[], opts: ChatOptions, stream: boolean) {
    return {
      model: this.model,
      messages: messages.map(toWireMessage),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream,
    };
  }

  async chat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.body(messages, opts, false)),
      signal: opts.signal,
    });
    if (!res.ok) {
      throw new Error(`Provider error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected response shape from provider.');
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
      headers: this.headers(),
      body: JSON.stringify(this.body(messages, opts, true)),
      signal: opts.signal,
    });
    if (!res.ok) {
      throw new Error(`Provider error ${res.status}: ${await res.text()}`);
    }
    if (!res.body) {
      throw new Error('Streaming not supported by provider.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            full += delta;
            onToken(delta);
          }
        } catch {
          // Ignore malformed chunks.
        }
      }
    }

    return full;
  }
}
