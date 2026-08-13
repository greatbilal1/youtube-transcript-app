import { useState } from 'react';
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
}

export function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateProvider,
  onSetActive,
  onSetTemperature,
  onSetMaxTokens,
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
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Temperature: {settings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => onSetTemperature(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
