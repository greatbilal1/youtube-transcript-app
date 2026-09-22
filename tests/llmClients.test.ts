import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAICompatibleClient } from '../src/lib/llm/openaiCompatible';
import { OllamaClient } from '../src/lib/llm/ollama';
import { createLLMClient } from '../src/lib/llm/factory';
import type { ChatMessage, ProviderConfig } from '../src/types';

const MESSAGES: ChatMessage[] = [{ id: 'm1', role: 'user', content: 'hi', createdAt: 0 }];
const OPTS = { temperature: 0.3, maxTokens: 128 };

function provider(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    id: 'deepinfra',
    label: 'DeepInfra',
    baseUrl: 'https://api.example.com/v1/',
    apiKey: 'test-key',
    model: 'test-model',
    ...overrides,
  };
}

/** A Response whose body streams the given chunks in order. */
function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status });
}

function stubFetch(response: Response | (() => Response)) {
  const mock = vi.fn(async () => (typeof response === 'function' ? response() : response));
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAICompatibleClient.chat', () => {
  it('posts to /chat/completions with a bearer token and returns the content', async () => {
    const fetchMock = stubFetch(jsonResponse({ choices: [{ message: { content: 'hello' } }] }));

    await expect(new OpenAICompatibleClient(provider()).chat(MESSAGES, OPTS)).resolves.toBe('hello');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'test-model',
      stream: false,
      temperature: 0.3,
      max_tokens: 128,
    });
  });

  it('omits the Authorization header when no API key is configured', async () => {
    const fetchMock = stubFetch(jsonResponse({ choices: [{ message: { content: 'ok' } }] }));

    await new OpenAICompatibleClient(provider({ apiKey: '' })).chat(MESSAGES, OPTS);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('surfaces the provider status on a failed request', async () => {
    stubFetch(new Response('unauthorized', { status: 401 }));
    await expect(new OpenAICompatibleClient(provider()).chat(MESSAGES, OPTS)).rejects.toThrow(
      /Provider error 401/,
    );
  });

  it('rejects an unexpected response shape', async () => {
    stubFetch(jsonResponse({ choices: [] }));
    await expect(new OpenAICompatibleClient(provider()).chat(MESSAGES, OPTS)).rejects.toThrow(
      /Unexpected response shape/,
    );
  });

  it('passes the abort signal through to fetch so Stop can cancel a request', async () => {
    const fetchMock = stubFetch(jsonResponse({ choices: [{ message: { content: 'x' } }] }));
    const controller = new AbortController();

    await new OpenAICompatibleClient(provider()).chat(MESSAGES, {
      ...OPTS,
      signal: controller.signal,
    });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});

describe('OpenAICompatibleClient.chatStream', () => {
  it('reassembles SSE events split across chunk boundaries', async () => {
    stubFetch(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"Hel',
        'lo"}}]}\n\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );

    const tokens: string[] = [];
    const full = await new OpenAICompatibleClient(provider()).chatStream(MESSAGES, OPTS, (t) =>
      tokens.push(t),
    );

    expect(full).toBe('Hello world');
    expect(tokens).toEqual(['Hello', ' world']);
  });

  it('skips malformed chunks instead of failing the stream', async () => {
    stubFetch(
      streamResponse([
        'data: {not valid json}\n\n',
        'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );

    const full = await new OpenAICompatibleClient(provider()).chatStream(MESSAGES, OPTS, () => {});
    expect(full).toBe('ok');
  });

  it('ignores deltas that are empty or not strings', async () => {
    stubFetch(
      streamResponse([
        'data: {"choices":[{"delta":{}}]}\n\n',
        'data: {"choices":[{"delta":{"content":""}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"real"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );

    const tokens: string[] = [];
    const full = await new OpenAICompatibleClient(provider()).chatStream(MESSAGES, OPTS, (t) =>
      tokens.push(t),
    );
    expect(full).toBe('real');
    expect(tokens).toEqual(['real']);
  });
});

describe('OllamaClient', () => {
  const ollama = provider({ id: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '' });

  it('posts to /api/chat without an auth header', async () => {
    const fetchMock = stubFetch(jsonResponse({ message: { content: 'hi there' } }));

    await expect(new OllamaClient(ollama).chat(MESSAGES, OPTS)).resolves.toBe('hi there');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/chat');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'test-model',
      stream: false,
      options: { temperature: 0.3, num_predict: 128 },
    });
  });

  it('rejects an unexpected response shape', async () => {
    stubFetch(jsonResponse({ done: true }));
    await expect(new OllamaClient(ollama).chat(MESSAGES, OPTS)).rejects.toThrow(
      /Unexpected response shape/,
    );
  });

  it('parses the NDJSON stream and stops at the done marker', async () => {
    stubFetch(
      streamResponse([
        '{"message":{"content":"Hel"}}\n',
        '{"message":{"content":"lo"}}\n',
        '{"done":true}\n',
      ]),
    );

    const tokens: string[] = [];
    const full = await new OllamaClient(ollama).chatStream(MESSAGES, OPTS, (t) => tokens.push(t));

    expect(full).toBe('Hello');
    expect(tokens).toEqual(['Hel', 'lo']);
  });

  it('reassembles NDJSON lines split across chunk boundaries', async () => {
    stubFetch(
      streamResponse(['{"message":{"cont', 'ent":"split"}}\n', '{"done":true}\n']),
    );

    const full = await new OllamaClient(ollama).chatStream(MESSAGES, OPTS, () => {});
    expect(full).toBe('split');
  });
});

describe('createLLMClient', () => {
  it('uses the Ollama client for the ollama provider', () => {
    expect(createLLMClient(provider({ id: 'ollama' }))).toBeInstanceOf(OllamaClient);
  });

  it('uses the OpenAI-compatible client for every other provider', () => {
    expect(createLLMClient(provider({ id: 'deepinfra' }))).toBeInstanceOf(OpenAICompatibleClient);
    expect(createLLMClient(provider({ id: 'opencodezen' }))).toBeInstanceOf(OpenAICompatibleClient);
    expect(createLLMClient(provider({ id: 'custom' }))).toBeInstanceOf(OpenAICompatibleClient);
  });
});
