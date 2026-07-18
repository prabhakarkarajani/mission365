import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'mission365-storage' });

export const storage = {
  getString(key: string): string | null {
    return mmkv.getString(key) ?? null;
  },
  set(key: string, value: string): void {
    mmkv.set(key, value);
  },
  delete(key: string): void {
    mmkv.remove(key);
  },
};
