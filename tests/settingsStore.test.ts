import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSettings, saveSettings } from '../src/lib/storage/settingsStore';
import { DEFAULT_SETTINGS } from '../src/config/providers';

const STORAGE_KEY = 'yt-transcript-settings';

beforeEach(() => {
  localStorage.clear();
});

describe('loadSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns a fresh copy rather than the shared default object', () => {
    const loaded = loadSettings();
    expect(loaded).not.toBe(DEFAULT_SETTINGS);
    expect(loaded.providers).not.toBe(DEFAULT_SETTINGS.providers);

    loaded.providers.deepinfra.apiKey = 'mutated';
    expect(DEFAULT_SETTINGS.providers.deepinfra.apiKey).toBe('');
  });

  it('merges stored values over the defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeProviderId: 'ollama', temperature: 0.9 }),
    );

    const loaded = loadSettings();
    expect(loaded.activeProviderId).toBe('ollama');
    expect(loaded.temperature).toBe(0.9);
    expect(loaded.maxTokens).toBe(DEFAULT_SETTINGS.maxTokens);
  });

  it('keeps unspecified providers at their defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        providers: { deepinfra: { id: 'deepinfra', label: 'DeepInfra', baseUrl: 'https://x', apiKey: 'k', model: 'm' } },
      }),
    );

    const loaded = loadSettings();
    // The stored entry is applied...
    expect(loaded.providers.deepinfra.baseUrl).toBe('https://x');
    expect(loaded.providers.deepinfra.model).toBe('m');
    // ...except its key, which is dropped because remembering keys is opt-in.
    expect(loaded.providers.deepinfra.apiKey).toBe('');
    // Providers absent from storage keep their defaults.
    expect(loaded.providers.ollama).toEqual(DEFAULT_SETTINGS.providers.ollama);
    expect(loaded.providers.custom).toEqual(DEFAULT_SETTINGS.providers.custom);
  });

  it('fills in provider fields missing from a stored entry', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ providers: { ollama: { model: 'llama3.2' } } }),
    );

    const loaded = loadSettings();
    expect(loaded.providers.ollama.model).toBe('llama3.2');
    expect(loaded.providers.ollama.baseUrl).toBe(DEFAULT_SETTINGS.providers.ollama.baseUrl);
    expect(loaded.providers.ollama.label).toBe(DEFAULT_SETTINGS.providers.ollama.label);
  });

  it('drops a stored API key when the user has not opted in', () => {
    // Written by an older version of the app, which had no opt-in flag.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ providers: { deepinfra: { apiKey: 'sk-secret' } } }),
    );

    const loaded = loadSettings();
    expect(loaded.rememberApiKeys).toBe(false);
    expect(loaded.providers.deepinfra.apiKey).toBe('');
  });

  it('restores a stored API key when the user opted in', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rememberApiKeys: true,
        providers: { deepinfra: { apiKey: 'sk-secret' } },
      }),
    );

    const loaded = loadSettings();
    expect(loaded.rememberApiKeys).toBe(true);
    expect(loaded.providers.deepinfra.apiKey).toBe('sk-secret');
  });

  it('falls back to defaults when the stored value is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the stored value is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '"a string"');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores a stored providers value that is not an object', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ providers: ['deepinfra'] }));

    const loaded = loadSettings();
    expect(loaded.providers).toEqual(DEFAULT_SETTINGS.providers);
    expect(loaded).not.toHaveProperty('0');
  });
});

describe('saveSettings', () => {
  it('round-trips through storage', () => {
    const settings = { ...DEFAULT_SETTINGS, activeProviderId: 'ollama' as const, temperature: 0.7 };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('never writes an API key to disk by default', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      providers: {
        ...DEFAULT_SETTINGS.providers,
        deepinfra: { ...DEFAULT_SETTINGS.providers.deepinfra, apiKey: 'sk-secret' },
      },
    });

    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    expect(raw).not.toContain('sk-secret');
    expect(JSON.parse(raw).providers.deepinfra.apiKey).toBe('');
  });

  it('writes the API key only once the user opts in', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      rememberApiKeys: true,
      providers: {
        ...DEFAULT_SETTINGS.providers,
        deepinfra: { ...DEFAULT_SETTINGS.providers.deepinfra, apiKey: 'sk-secret' },
      },
    });

    expect(localStorage.getItem(STORAGE_KEY)).toContain('sk-secret');
    expect(loadSettings().providers.deepinfra.apiKey).toBe('sk-secret');
  });

  it('clears a previously saved key when the user opts back out', () => {
    const withKey = {
      ...DEFAULT_SETTINGS,
      rememberApiKeys: true,
      providers: {
        ...DEFAULT_SETTINGS.providers,
        deepinfra: { ...DEFAULT_SETTINGS.providers.deepinfra, apiKey: 'sk-secret' },
      },
    };
    saveSettings(withKey);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('sk-secret');

    saveSettings({ ...withKey, rememberApiKeys: false });

    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    expect(raw).not.toContain('sk-secret');
    expect(loadSettings().providers.deepinfra.apiKey).toBe('');
  });

  it('does not throw when storage rejects the write', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});
