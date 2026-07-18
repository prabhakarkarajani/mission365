import { api } from '@/shared/lib/api-client';
import type { AuthTokens } from '@/shared/lib/tokens';

import type { User } from '../domain/types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

type AuthResponse = { user: User } & AuthTokens;

export function register(input: RegisterInput) {
  return api.post<AuthResponse>('/auth/register', input, { skipAuth: true });
}

export function login(input: LoginInput) {
  return api.post<AuthResponse>('/auth/login', input, { skipAuth: true });
}

export function fetchMe() {
  return api.get<{ user: User }>('/auth/me');
}

export function logout() {
  return api.post<{ loggedOut: boolean }>('/auth/logout');
}
