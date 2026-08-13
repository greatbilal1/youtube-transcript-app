export type ProviderId = 'deepinfra' | 'opencodezen' | 'ollama' | 'custom';

/** Configuration for a single LLM provider. */
export interface ProviderConfig {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** Full settings state, persisted to localStorage. */
export interface SettingsState {
  providers: Record<ProviderId, ProviderConfig>;
  activeProviderId: ProviderId;
  temperature: number;
  maxTokens: number;
}
