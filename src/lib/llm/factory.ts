import type { ProviderConfig, SettingsState } from '../../types';
import type { LLMClient } from './client';
import { OpenAICompatibleClient } from './openaiCompatible';
import { OllamaClient } from './ollama';

/**
 * Factory that returns the correct LLM client for a provider.
 * Ollama uses its own /api/chat protocol; everything else is
 * assumed to be OpenAI-compatible.
 */
export function createLLMClient(provider: ProviderConfig): LLMClient {
  if (provider.id === 'ollama') {
    return new OllamaClient(provider);
  }
  return new OpenAICompatibleClient(provider);
}

/** Shown when a generation is attempted with no usable provider selected. */
export const NO_PROVIDER_ERROR =
  'No active provider configured. Open Settings to configure one.';

/**
 * The provider the user has selected, or null when it can't be called — a
 * provider with no model is as unusable as a missing one.
 */
export function resolveProvider(settings: SettingsState): ProviderConfig | null {
  const provider = settings.providers[settings.activeProviderId];
  return provider?.model ? provider : null;
}
