import type { ProviderConfig } from '../../types';

interface ProviderFormProps {
  provider: ProviderConfig;
  onChange: (patch: Partial<ProviderConfig>) => void;
}

const FIELD_CLASS =
  'w-full rounded-xl border border-gray-300/80 bg-white/70 px-3 py-2 text-sm text-gray-900 transition ' +
  'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 ' +
  'dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100';

export function ProviderForm({ provider, onChange }: ProviderFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Base URL
        </label>
        <input
          type="url"
          value={provider.baseUrl}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
          className={FIELD_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          API Key
        </label>
        <input
          type="password"
          value={provider.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          placeholder={provider.id === 'ollama' ? 'Not required for Ollama' : 'sk-...'}
          className={FIELD_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Model ID
        </label>
        <input
          type="text"
          value={provider.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="model-name"
          className={FIELD_CLASS}
        />
      </div>
    </div>
  );
}
