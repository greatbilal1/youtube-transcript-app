import type { ProviderConfig } from '../../types';
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
