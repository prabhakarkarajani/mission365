function safeLocalStorage(): Storage | null {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export const storage = {
  getString(key: string): string | null {
    return safeLocalStorage()?.getItem(key) ?? null;
  },
  set(key: string, value: string): void {
    safeLocalStorage()?.setItem(key, value);
  },
  delete(key: string): void {
    safeLocalStorage()?.removeItem(key);
  },
};
