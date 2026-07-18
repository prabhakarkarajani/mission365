import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, ModalHeader, Text } from '@/shared/ui';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useUpdateProfile } from '@/features/profile/application/user.hooks';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    try {
      await updateProfile.mutateAsync({ name: name.trim(), timezone: timezone.trim() });
      router.back();
    } catch {
      setError('Could not save changes. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader title="Edit Profile" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <Input label="Full Name" value={name} onChangeText={setName} />
        <Input label="Timezone" value={timezone} onChangeText={setTimezone} placeholder="e.g. America/New_York" />
        <Input label="Email" value={user?.email ?? ''} editable={false} />
        {error ? (
          <Text color="danger" variant="bodySmall">
            {error}
          </Text>
        ) : null}
        <Button label="Save Changes" variant="primary" size="lg" loading={updateProfile.isPending} onPress={onSave} />
      </ScrollView>
    </SafeAreaView>
  );
}
