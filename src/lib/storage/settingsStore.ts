import type { SettingsState } from '../../types';
import { DEFAULT_SETTINGS } from '../../config/providers';

const STORAGE_KEY = 'yt-transcript-settings';

/** Load settings from localStorage, falling back to defaults. */
export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    // Merge with defaults so new fields are always present.
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...parsed,
      providers: {
        ...structuredClone(DEFAULT_SETTINGS.providers),
        ...(parsed.providers ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

/** Persist settings to localStorage. */
export function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
}
