import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Card, IconButton, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { useHabits } from '@/features/habits/application/habit.hooks';
import { useSyncHabitReminders } from '@/features/habits/application/useSyncHabitReminders';

export default function HabitsScreen() {
  const { data: habits, isLoading } = useHabits();
  useSyncHabitReminders(habits);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-6">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Habits</Text>
          <IconButton icon="add" accessibilityLabel="Add habit" onPress={() => router.push('/habits/new')} />
        </View>

        {isLoading ? (
          <Text color="muted">Loading...</Text>
        ) : !habits || habits.length === 0 ? (
          <Card className="items-center gap-2 py-10">
            <Ionicons name="checkmark-done-outline" size={32} color={colors.muted} />
            <Text variant="body" color="muted" className="text-center">
              No habits yet. Start building your routine.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/habits/new')}>
              <Text color="primary">Add your first habit</Text>
            </Pressable>
          </Card>
        ) : (
          habits.map((habit) => (
            <Pressable
              key={habit._id}
              accessibilityRole="button"
              onPress={() => router.push(`/habits/${habit._id}`)}
            >
              <Card className="flex-row items-center gap-3">
                <View
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${habit.color}22` }}
                >
                  <Ionicons name={asIoniconName(habit.icon)} size={20} color={habit.color} />
                </View>
                <View className="flex-1 gap-1">
                  <Text variant="body">{habit.name}</Text>
                  <View className="flex-row items-center gap-2">
                    <Badge label={habit.category} color="muted" />
                    {habit.currentStreak > 0 ? (
                      <Text variant="caption" color="muted">
                        🔥 {habit.currentStreak}d streak
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
