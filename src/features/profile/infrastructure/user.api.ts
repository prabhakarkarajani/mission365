import { api } from '@/shared/lib/api-client';
import type { User } from '@/features/auth/domain/types';

export interface UpdateMeInput {
  name?: string;
  avatarUrl?: string | null;
  timezone?: string;
  notificationPreferences?: Partial<{
    dailyReminder: boolean;
    streakAlerts: boolean;
    goalMilestones: boolean;
  }>;
  appearance?: Partial<{ colorScheme: 'light' | 'dark' | 'system' }>;
}

export function updateMe(input: UpdateMeInput) {
  return api.patch<{ user: User }>('/users/me', input);
}

export function deleteAccount() {
  return api.delete<{ deleted: true }>('/users/me');
}
