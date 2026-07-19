import type { AIProvider } from '../../core/interfaces/AIProvider';
import { mockProvider } from '../mock/mock.provider';

// TODO(Phase 4): replace with a real Ollama call (local or hosted) once configured.
export const ollamaProvider: AIProvider = {
  name: 'ollama',
  generateRoadmap: (input) => mockProvider.generateRoadmap(input),
};
