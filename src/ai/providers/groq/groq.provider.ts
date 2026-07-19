import type { AIProvider } from '../../core/interfaces/AIProvider';
import { mockProvider } from '../mock/mock.provider';

// TODO(Phase 4): replace with a real Groq SDK call once an API key is configured.
export const groqProvider: AIProvider = {
  name: 'groq',
  generateRoadmap: (input) => mockProvider.generateRoadmap(input),
  chat: (input) => mockProvider.chat(input),
};
