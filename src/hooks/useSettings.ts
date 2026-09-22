import { useCallback, useEffect, useState } from 'react';
import type { ProviderConfig, ProviderId, SettingsState } from '../types';
import { DEFAULT_SETTINGS } from '../config/providers';
import { loadSettings, saveSettings } from '../lib/storage/settingsStore';

/**
 * Provider settings state with localStorage persistence.
 * Exposes update helpers for the Settings modal.
 */
export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateProvider = useCallback(
    (id: ProviderId, patch: Partial<ProviderConfig>) => {
      setSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          [id]: { ...prev.providers[id], ...patch },
        },
      }));
    },
    [],
  );

  const setActiveProvider = useCallback((id: ProviderId) => {
    setSettings((prev) => ({ ...prev, activeProviderId: id }));
  }, []);

  const setTemperature = useCallback((temperature: number) => {
    setSettings((prev) => ({ ...prev, temperature }));
  }, []);

  const setMaxTokens = useCallback((maxTokens: number) => {
    setSettings((prev) => ({ ...prev, maxTokens }));
  }, []);

  /** Opt in or out of storing API keys on disk. */
  const setRememberApiKeys = useCallback((rememberApiKeys: boolean) => {
    setSettings((prev) => ({ ...prev, rememberApiKeys }));
  }, []);

  /** Restore the shipped defaults, discarding configured base URLs and API keys. */
  const resetSettings = useCallback(() => {
    setSettings(structuredClone(DEFAULT_SETTINGS));
  }, []);

  return {
    settings,
    updateProvider,
    setActiveProvider,
    setTemperature,
    setMaxTokens,
    setRememberApiKeys,
    resetSettings,
  };
}
