import { env } from '../../../config/env';
import type { AIProvider } from '../interfaces/AIProvider';
import { mockProvider } from '../../providers/mock/mock.provider';
import { openaiProvider } from '../../providers/openai/openai.provider';

const providers: Record<string, AIProvider> = {
  mock: mockProvider,
  openai: openaiProvider,
  // claude/gemini/ollama added here in a later phase, same shape.
};

/**
 * Single switch point every consumer (the coach service) depends on -
 * never import a provider module directly. Keyed on the server-only
 * env.AI_PROVIDER (never an EXPO_PUBLIC_* var - that prefix is bundled into
 * the client and is exactly the key-leak this architecture avoids).
 */
export function createAIProvider(): AIProvider {
  return providers[env.AI_PROVIDER] ?? mockProvider;
}
