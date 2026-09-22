import type { ProviderConfig, ProviderId, SettingsState } from '../../types';
import { DEFAULT_PROVIDERS, DEFAULT_SETTINGS } from '../../config/providers';

const STORAGE_KEY = 'yt-transcript-settings';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Settings with every API key blanked, for writing to disk. Keys are held in
 * memory unless the user opts in, so this is what gets persisted by default.
 */
function withoutApiKeys(settings: SettingsState): SettingsState {
  const providers = {} as Record<ProviderId, ProviderConfig>;
  for (const id of Object.keys(settings.providers) as ProviderId[]) {
    providers[id] = { ...settings.providers[id], apiKey: '' };
  }
  return { ...settings, providers };
}

/** Load settings from localStorage, falling back to defaults. */
export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);

    const parsed: unknown = JSON.parse(raw);
    // Anything can be in localStorage — a stale write, hand-edited JSON, or a
    // truncated value. Spreading a non-object (e.g. a string or array) would
    // merge its index keys into the settings, so reject it outright.
    if (!isPlainObject(parsed)) return structuredClone(DEFAULT_SETTINGS);
    const partial = parsed as Partial<SettingsState>;

    // Keys are read back only when the user opted in. A key written by an older
    // version of the app has no flag alongside it, so it is dropped rather than
    // silently restored, and the next save clears it from disk.
    const rememberApiKeys = partial.rememberApiKeys === true;

    // Merge with defaults so fields added in a later version are always present,
    // per provider as well as at the top level: a stored provider entry written
    // before a field existed would otherwise leave that field undefined.
    const storedProviders: Record<string, unknown> = isPlainObject(partial.providers)
      ? partial.providers
      : {};
    const providers = {} as Record<ProviderId, ProviderConfig>;
    for (const id of Object.keys(DEFAULT_PROVIDERS) as ProviderId[]) {
      const stored = storedProviders[id];
      const merged = {
        ...structuredClone(DEFAULT_PROVIDERS[id]),
        ...(isPlainObject(stored) ? stored : {}),
      } as ProviderConfig;
      providers[id] = rememberApiKeys ? merged : { ...merged, apiKey: '' };
    }

    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...partial,
      rememberApiKeys,
      providers,
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

/**
 * Persist settings to localStorage. API keys are stripped unless the user opted
 * into remembering them, so turning the option off also removes a key that was
 * previously written.
 */
export function saveSettings(settings: SettingsState): void {
  try {
    const toStore = settings.rememberApiKeys ? settings : withoutApiKeys(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
}
