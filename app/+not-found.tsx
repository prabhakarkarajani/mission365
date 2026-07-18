import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/shared/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background p-6 dark:bg-background-dark">
        <Text variant="h2">This screen doesn&apos;t exist.</Text>
        <Link href="/" replace>
          <Text color="primary">Go back home</Text>
        </Link>
      </View>
    </>
  );
}
