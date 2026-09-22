import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { ProviderId, SettingsState } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProviderList } from './ProviderList';
import { ProviderForm } from './ProviderForm';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsState;
  onUpdateProvider: (
    id: ProviderId,
    patch: Partial<SettingsState['providers'][ProviderId]>,
  ) => void;
  onSetActive: (id: ProviderId) => void;
  onSetTemperature: (t: number) => void;
  onSetMaxTokens: (t: number) => void;
  onSetRememberApiKeys: (remember: boolean) => void;
  onReset: () => void;
}

export function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateProvider,
  onSetActive,
  onSetTemperature,
  onSetMaxTokens,
  onSetRememberApiKeys,
  onReset,
}: SettingsModalProps) {
  const [selectedId, setSelectedId] = useState<ProviderId>(settings.activeProviderId);
  const selected = settings.providers[selectedId];

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Providers
          </h3>
          <ProviderList
            providers={settings.providers}
            activeId={settings.activeProviderId}
            onSelect={(id) => {
              setSelectedId(id);
              onSetActive(id);
            }}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {selected?.label ?? 'Provider'}
          </h3>
          {selected && (
            <ProviderForm
              provider={selected}
              onChange={(patch) => onUpdateProvider(selectedId, patch)}
            />
          )}

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Temperature
                </label>
                <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
              <Slider.Root
                min={0}
                max={1}
                step={0.1}
                value={[settings.temperature]}
                onValueChange={(v) => onSetTemperature(v[0])}
                className="relative flex h-5 w-full touch-none select-none items-center"
                aria-label="Temperature"
              >
                <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <Slider.Range className="absolute h-full rounded-full bg-gradient-brand" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full bg-white shadow-md ring-1 ring-brand-400 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" />
              </Slider.Root>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max Tokens
              </label>
              <input
                type="number"
                min={256}
                max={8192}
                step={256}
                value={settings.maxTokens}
                onChange={(e) => onSetMaxTokens(parseInt(e.target.value, 10) || 2048)}
                className="w-full rounded-xl border border-gray-300/80 bg-white/70 px-3 py-2 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <input
          type="checkbox"
          checked={settings.rememberApiKeys}
          onChange={(e) => onSetRememberApiKeys(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
        />
        <span className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-gray-100">
            Remember API keys on this device
          </span>
          <br />
          {settings.rememberApiKeys
            ? 'Keys are saved unencrypted in this browser and will be here when you come back.'
            : 'Keys are kept in memory only and are gone when you reload. Nothing is written to disk.'}
        </span>
      </label>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Reset all provider settings to defaults? Configured base URLs and API keys will be cleared.',
              )
            ) {
              onReset();
            }
          }}
          className="text-xs font-medium text-gray-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        >
          Reset to defaults
        </button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
