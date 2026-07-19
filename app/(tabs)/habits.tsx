import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, EmptyState, IconButton, LoadingState, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { formatDurationMinutes, formatTime12h } from '@/shared/lib/date';
import { useHabits } from '@/features/habits/application/habit.hooks';
import { useSyncHabitReminders } from '@/features/habits/application/useSyncHabitReminders';
import { recurrenceLabel } from '@/features/habits/domain/recurrence';
import { getMissionPresentation, PRIORITY_COLOR } from '@/features/home/domain/missionPresentation';
import type { Habit } from '@/features/habits/domain/types';

export default function HabitsScreen() {
  const { data: habits, isLoading } = useHabits();
  useSyncHabitReminders(habits);

  const withReminders = (habits ?? [])
    .filter((h) => h.reminderTime)
    .sort((a, b) => (a.reminderTime! < b.reminderTime! ? -1 : 1));

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-6">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Missions</Text>
          <IconButton icon="add" accessibilityLabel="Add habit" onPress={() => router.push('/habits/new')} />
        </View>

        {isLoading ? (
          <LoadingState label="Loading missions..." />
        ) : !habits || habits.length === 0 ? (
          <Card>
            <EmptyState
              icon="checkmark-done-outline"
              title="No missions yet"
              description="Start building your routine."
              actionLabel="Add your first mission"
              onAction={() => router.push('/habits/new')}
            />
          </Card>
        ) : (
          <>
            {withReminders.length > 0 ? (
              <Card className="gap-3">
                <Text variant="h3">Mission Timeline</Text>
                <View className="gap-0">
                  {withReminders.map((habit, index) => (
                    <View key={habit._id} className="flex-row gap-3">
                      <View className="items-center">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${habit.color}22` }}
                        >
                          <Ionicons name={asIoniconName(habit.icon)} size={13} color={habit.color} />
                        </View>
                        {index < withReminders.length - 1 ? (
                          <View className="w-px flex-1 bg-border dark:bg-border-dark" />
                        ) : null}
                      </View>
                      <View className="flex-1 pb-3">
                        <Text variant="caption" color="muted">
                          {formatTime12h(habit.reminderTime as string)}
                        </Text>
                        <Text variant="bodySmall">{habit.name}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <View className="gap-3">
              <Text variant="h3">All Missions</Text>
              {habits.map((habit) => (
                <MissionListCard key={habit._id} habit={habit} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionListCard({ habit }: { habit: Habit }) {
  const presentation = getMissionPresentation(habit.category);

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/habits/${habit._id}`)}>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            <Ionicons name={asIoniconName(habit.icon)} size={20} color={habit.color} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="body" numberOfLines={1}>
              {habit.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text variant="caption" color="muted">
                {presentation.categoryLabel}
              </Text>
              <Text variant="caption" color={PRIORITY_COLOR[presentation.priority]}>
                {presentation.priority[0]}
                {presentation.priority.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 pl-14">
          {habit.reminderTime ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color={colors.muted} />
              <Text variant="caption" color="muted">
                {formatTime12h(habit.reminderTime)}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-1">
            <Ionicons name="repeat-outline" size={13} color={colors.muted} />
            <Text variant="caption" color="muted">
              {recurrenceLabel(habit.frequency)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="hourglass-outline" size={13} color={colors.muted} />
            <Text variant="caption" color="muted">
              {formatDurationMinutes(presentation.durationMinutes)}
            </Text>
          </View>
          {habit.currentStreak > 0 ? (
            <Text variant="caption" color="muted">
              🔥 {habit.currentStreak}d streak
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
