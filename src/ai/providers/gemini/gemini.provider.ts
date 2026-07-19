import type { AIProvider } from '../../core/interfaces/AIProvider';
import { mockProvider } from '../mock/mock.provider';

// TODO(Phase 4): replace with a real Gemini SDK call once an API key is configured.
export const geminiProvider: AIProvider = {
  name: 'gemini',
  generateRoadmap: (input) => mockProvider.generateRoadmap(input),
};
