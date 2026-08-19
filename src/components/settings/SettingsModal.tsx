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

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
