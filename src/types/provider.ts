export type ProviderId = 'deepinfra' | 'opencodezen' | 'ollama' | 'custom';

/** Configuration for a single LLM provider. */
export interface ProviderConfig {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Full settings state. Everything except API keys is persisted to localStorage;
 * keys are written only when `rememberApiKeys` is set, and otherwise live in
 * memory for the lifetime of the page.
 */
export interface SettingsState {
  providers: Record<ProviderId, ProviderConfig>;
  activeProviderId: ProviderId;
  temperature: number;
  maxTokens: number;
  /** Opt-in to storing API keys in localStorage. Off by default. */
  rememberApiKeys: boolean;
}
