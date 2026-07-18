import { storage } from './storage';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): AuthTokens | null {
  const accessToken = storage.getString(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getString(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: AuthTokens): void {
  storage.set(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  storage.delete(ACCESS_TOKEN_KEY);
  storage.delete(REFRESH_TOKEN_KEY);
}
