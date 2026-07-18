import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/shared/ui';
import { useAuthStore } from '@/features/auth/application/auth.store';

export default function WelcomeScreen() {
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <Text variant="display" className="text-center text-primary">
          Mission365
        </Text>
        <Text variant="body" color="muted" className="text-center">
          Your Personal Life OS
        </Text>
      </View>

      <View className="gap-2 px-8 pb-4">
        <Text variant="h2" className="text-center">
          Small daily actions.{'\n'}Big life transformation.
        </Text>
      </View>

      <View className="gap-3 px-8 pb-8 pt-4">
        <Button
          label="Let's Get Started"
          variant="primary"
          size="lg"
          onPress={() => router.push('/signup')}
        />
        <Button
          label="I already have an account"
          variant="ghost"
          size="lg"
          onPress={() => router.push('/login')}
        />
      </View>
    </SafeAreaView>
  );
}
