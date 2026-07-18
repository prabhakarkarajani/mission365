import type { StateStorage } from 'zustand/middleware';

import { storage } from './storage';

export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name),
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};
