import type { ProviderConfig, ProviderId, SettingsState } from '../types';

/**
 * Default provider presets. These are the starting values shown in the
 * Settings modal. Users can override baseUrl / apiKey / model per provider.
 */
export const DEFAULT_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  deepinfra: {
    id: 'deepinfra',
    label: 'DeepInfra',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    apiKey: '',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  },
  opencodezen: {
    id: 'opencodezen',
    label: 'OpenCode Zen',
    baseUrl: 'https://opencodezen.ai/api/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (localhost)',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    model: 'llama3.1',
  },
  custom: {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    apiKey: '',
    model: '',
  },
};

export const DEFAULT_SETTINGS: SettingsState = {
  providers: DEFAULT_PROVIDERS,
  activeProviderId: 'deepinfra',
  temperature: 0.3,
  maxTokens: 2048,
};
