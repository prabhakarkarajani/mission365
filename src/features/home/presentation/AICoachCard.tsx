import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useHabitLogs, useHabits } from '@/features/habits/application/habit.hooks';
import { formatDurationMinutes, greetingForHour, subtractDays, toDateKey, todayKey } from '@/shared/lib/date';
import type { BriefMission } from '../application/useHomeBrief';

export interface AICoachCardProps {
  firstName: string;
  topPendingMission: BriefMission | null;
  onDismiss: () => void;
}

export function AICoachCard({ firstName, topPendingMission, onDismiss }: AICoachCardProps) {
  const yesterday = subtractDays(todayKey(), 1);
  const { data: habits } = useHabits();
  const { data: yesterdayLogs } = useHabitLogs(yesterday, yesterday);

  const skippedYesterday = useMemo(() => {
    if (!habits || !yesterdayLogs) return null;
    const completedIds = new Set(yesterdayLogs.filter((l) => l.completedAt).map((l) => l.habitId));
    return (
      habits.find(
        (h) =>
          !h.isArchived &&
          h.frequency.type === 'daily' &&
          !completedIds.has(h._id) &&
          toDateKey(new Date(h.createdAt)) <= yesterday
      ) ?? null
    );
  }, [habits, yesterdayLogs, yesterday]);

  const greeting = greetingForHour(new Date().getHours());

  return (
    <Card className="gap-3 border border-primary/15" bordered>
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text variant="h3">Maya</Text>
          <Text variant="caption" color="muted">
            Your AI Coach
          </Text>
        </View>
      </View>

      <Text variant="body">
        {greeting}
        {firstName ? `, ${firstName}` : ''}.
      </Text>

      {topPendingMission ? (
        <Text variant="bodySmall" color="muted">
          Today&apos;s biggest opportunity is to finish{' '}
          <Text variant="bodySmall" color="default">
            {topPendingMission.mission.habit.name}
          </Text>
          . Estimated time {formatDurationMinutes(topPendingMission.durationMinutes)}.
        </Text>
      ) : (
        <Text variant="bodySmall" color="muted">
          You&apos;re all caught up on today&apos;s missions. Nice work.
        </Text>
      )}

      {skippedYesterday ? (
        <Text variant="bodySmall" color="muted">
          You skipped {skippedYesterday.name} yesterday. Would you like to schedule it tonight?
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          label="Continue"
          size="sm"
          variant="primary"
          className="flex-1"
          disabled={!topPendingMission}
          onPress={() => {
            if (topPendingMission) router.push(`/habits/${topPendingMission.mission.habit._id}`);
          }}
        />
        <Button label="Ask AI" size="sm" variant="outline" className="flex-1" onPress={() => router.push('/coach')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss for now"
          onPress={onDismiss}
          className="h-9 items-center justify-center px-3"
        >
          <Text variant="bodySmall" color="muted">
            Later
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
