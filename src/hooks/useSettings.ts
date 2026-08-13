import { useCallback, useEffect, useState } from 'react';
import type { ProviderConfig, ProviderId, SettingsState } from '../types';
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

  const resetSettings = useCallback(() => {
    setSettings(loadSettings());
  }, []);

  return {
    settings,
    updateProvider,
    setActiveProvider,
    setTemperature,
    setMaxTokens,
    resetSettings,
  };
}
