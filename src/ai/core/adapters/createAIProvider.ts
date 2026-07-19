import type { AIProvider } from '../interfaces/AIProvider';
import { claudeProvider } from '../../providers/claude/claude.provider';
import { geminiProvider } from '../../providers/gemini/gemini.provider';
import { groqProvider } from '../../providers/groq/groq.provider';
import { mockProvider } from '../../providers/mock/mock.provider';
import { ollamaProvider } from '../../providers/ollama/ollama.provider';
import { openaiProvider } from '../../providers/openai/openai.provider';

const providers: Record<string, AIProvider> = {
  mock: mockProvider,
  openai: openaiProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
  groq: groqProvider,
  ollama: ollamaProvider,
};

/**
 * Single switch point business logic depends on. Business code (e.g. the
 * Coach feature) should only ever import this factory — never a provider
 * module directly — so swapping vendors never touches feature code.
 */
export function createAIProvider(): AIProvider {
  const requested = process.env.EXPO_PUBLIC_AI_PROVIDER;
  return providers[requested ?? 'mock'] ?? mockProvider;
}
