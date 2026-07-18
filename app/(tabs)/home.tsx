import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Card, Checkbox, CircularProgress, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useTodayMissions, useToggleHabitCompletion } from '@/features/habits/application/habit.hooks';
import { todayKey } from '@/shared/lib/date';
import type { IoniconName } from '@/shared/lib/icon-name';

const QUICK_ACTIONS: { href: Href; icon: IoniconName; label: string; color: string }[] = [
  { href: '/journal', icon: 'book-outline', label: 'Journal', color: colors.accent },
  { href: '/trackers', icon: 'water-outline', label: 'Trackers', color: colors.primary },
  { href: '/focus', icon: 'timer-outline', label: 'Focus', color: colors.success },
  { href: '/calendar', icon: 'calendar-outline', label: 'Calendar', color: colors.warning },
  { href: '/analytics', icon: 'bar-chart-outline', label: 'Analytics', color: colors.secondary },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch } = useTodayMissions();
  const toggleCompletion = useToggleHabitCompletion();
  const [refreshing, setRefreshing] = useState(false);

  const missions = data?.missions ?? [];
  const completedCount = missions.filter((m) => m.completed).length;
  const pendingCount = missions.length - completedCount;
  const percent = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-5 p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-1">
          <Text variant="h1">Good Morning{firstName ? `, ${firstName}` : ''} 👋</Text>
          {user && user.currentStreak > 0 ? (
            <Badge label={`🔥 ${user.currentStreak} day streak`} color="primary" />
          ) : (
            <Text variant="body" color="muted">
              Let&apos;s build your first streak today.
            </Text>
          )}
        </View>

        <Card className="items-center gap-4 py-6">
          <CircularProgress percent={percent} label="Today's Progress" />
          <View className="w-full flex-row justify-around">
            <View className="items-center">
              <Text variant="h3" color="success">
                {completedCount}
              </Text>
              <Text variant="caption" color="muted">
                Completed
              </Text>
            </View>
            <View className="items-center">
              <Text variant="h3" color="danger">
                {pendingCount}
              </Text>
              <Text variant="caption" color="muted">
                Pending
              </Text>
            </View>
            <View className="items-center">
              <Text variant="h3" color="primary">
                {user?.xp ?? 0}
              </Text>
              <Text variant="caption" color="muted">
                Total XP
              </Text>
            </View>
          </View>
        </Card>

        <View className="gap-3">
          <Text variant="h3">Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => router.push(action.href)}
                className="w-20 items-center gap-2"
              >
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${action.color}1A` }}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Today&apos;s Missions</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add habit"
              onPress={() => router.push('/habits/new')}
            >
              <Text color="primary" variant="bodySmall">
                + Add
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <Text color="muted">Loading...</Text>
          ) : missions.length === 0 ? (
            <Card className="items-center gap-2 py-8">
              <Text variant="body" color="muted" className="text-center">
                No habits yet. Add your first one to start today&apos;s missions.
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/habits/new')}>
                <Text color="primary">Add a habit</Text>
              </Pressable>
            </Card>
          ) : (
            missions.map(({ habit, completed }) => (
              <Card key={habit._id} className="flex-row items-center gap-3">
                <Checkbox
                  checked={completed}
                  onPress={() =>
                    toggleCompletion.mutate({ habitId: habit._id, date: todayKey(), completed: !completed })
                  }
                />
                <View className="flex-1">
                  <Text variant="body">{habit.name}</Text>
                  {habit.currentStreak > 0 ? (
                    <Text variant="caption" color="muted">
                      🔥 {habit.currentStreak} day streak
                    </Text>
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
