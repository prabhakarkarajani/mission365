import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, ErrorState, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievements } from '@/features/gamification/application/achievement.hooks';

export default function AchievementsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: achievements, isLoading, isError, refetch } = useAchievements();
  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Achievements" />
      <ScrollView contentContainerClassName="gap-4 px-6 pb-8">
        <View className="flex-row gap-3">
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="warning">
              {unlockedCount}
            </Text>
            <Text variant="caption" color="muted">
              Unlocked
            </Text>
          </Card>
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="primary">
              {user?.xp ?? 0}
            </Text>
            <Text variant="caption" color="muted">
              Total XP
            </Text>
          </Card>
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="success">
              {user?.level ?? 1}
            </Text>
            <Text variant="caption" color="muted">
              Level
            </Text>
          </Card>
        </View>

        {isLoading ? (
          <Text color="muted">Loading...</Text>
        ) : isError ? (
          <Card>
            <ErrorState description="Couldn't load your achievements. Check your connection and try again." onRetry={() => refetch()} />
          </Card>
        ) : (
          achievements?.map((achievement) => (
            <Card
              key={achievement.id}
              className={`flex-row items-center gap-3 ${achievement.unlocked ? '' : 'opacity-50'}`}
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: achievement.unlocked ? `${colors.warning}22` : `${colors.muted}22` }}
              >
                <Ionicons
                  name={asIoniconName(achievement.icon)}
                  size={22}
                  color={achievement.unlocked ? colors.warning : colors.muted}
                />
              </View>
              <View className="flex-1">
                <Text variant="body">{achievement.title}</Text>
                <Text variant="caption" color="muted">
                  {achievement.description}
                </Text>
              </View>
              {achievement.unlocked ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
