import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';

import * as userApi from '../infrastructure/user.api';
import type { UpdateMeInput } from '../infrastructure/user.api';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: UpdateMeInput) => userApi.updateMe(input),
    onSuccess: ({ user }) => setUser(user),
  });
}

export function useDeleteAccount() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: async () => {
      await logout();
    },
  });
}
