import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BarChart, Card, ErrorState, Heatmap, LineChart, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAnalyticsSummary } from '@/features/analytics/application/analytics.hooks';
import { useHabitLogs, useHabits } from '@/features/habits/application/habit.hooks';
import { computeCategoryBreakdown, CATEGORY_LABELS } from '@/features/analytics/domain/categoryBreakdown';
import { formatWeekdayShort, subtractDays, todayKey } from '@/shared/lib/date';

const HEATMAP_DAYS = 30;

export default function AnalyticsScreen() {
  const { data, isLoading, isError, refetch } = useAnalyticsSummary(7);
  const {
    data: monthly,
    isLoading: monthlyLoading,
    isError: monthlyError,
    refetch: refetchMonthly,
  } = useAnalyticsSummary(HEATMAP_DAYS);
  const { data: habits } = useHabits();

  const monthStart = subtractDays(todayKey(), HEATMAP_DAYS - 1);
  const monthEnd = todayKey();
  const { data: monthLogs } = useHabitLogs(monthStart, monthEnd);

  const monthDates = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < HEATMAP_DAYS; i++) out.push(subtractDays(monthEnd, HEATMAP_DAYS - 1 - i));
    return out;
  }, [monthEnd]);

  const monthlyBreakdown = useMemo(
    () => (habits && monthLogs ? computeCategoryBreakdown(habits, monthLogs, monthDates) : []),
    [habits, monthLogs, monthDates]
  );

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <ErrorState description="Couldn't load your analytics. Check your connection and try again." onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Text color="muted">Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  const habitBars = data.habitCompletionSeries.map((d) => ({
    label: formatWeekdayShort(d.date),
    value: d.percent,
  }));

  const moodLine = data.moodTrendSeries.map((d) => ({
    label: formatWeekdayShort(d.date),
    value: d.moodScore,
  }));

  const focusBars = data.focusMinutesSeries.map((d) => ({
    label: formatWeekdayShort(d.date),
    value: d.minutes,
  }));

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Insights" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/weekly-review')}
          className="flex-row items-center justify-between rounded-card bg-primary/10 px-4 py-3.5"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="stats-chart" size={16} color={colors.primary} />
            <Text variant="bodySmall" color="primary">
              Open Weekly Review
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>

        <View className="flex-row gap-3">
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="primary">
              {data.weeklyHabitCompletionPercent}%
            </Text>
            <Text variant="caption" color="muted">
              Habits
            </Text>
          </Card>
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="success">
              {data.totalFocusMinutesThisWeek}m
            </Text>
            <Text variant="caption" color="muted">
              Focus
            </Text>
          </Card>
          <Card className="flex-1 items-center gap-1">
            <Text variant="h2" color="accent">
              🔥 {data.currentStreak}
            </Text>
            <Text variant="caption" color="muted">
              Streak
            </Text>
          </Card>
        </View>

        <Card className="gap-3">
          <Text variant="h3">Habit Completion</Text>
          <BarChart data={habitBars} maxValue={100} color={colors.primary} />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Mood Trend</Text>
          <LineChart data={moodLine} minValue={1} maxValue={5} color={colors.accent} />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Focus Minutes</Text>
          <BarChart data={focusBars} color={colors.success} />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Mission Heatmap</Text>
            <Text variant="caption" color="muted">
              Last {HEATMAP_DAYS} days
            </Text>
          </View>
          {monthlyError ? (
            <ErrorState description="Couldn't load the heatmap." onRetry={() => refetchMonthly()} />
          ) : monthlyLoading || !monthly ? (
            <Text variant="bodySmall" color="muted">
              Loading...
            </Text>
          ) : (
            <Heatmap data={monthly.habitCompletionSeries.map((d) => ({ date: d.date, percent: d.percent }))} />
          )}
        </Card>

        {monthlyBreakdown.length > 0 ? (
          <Card className="gap-3">
            <Text variant="h3">Category Consistency</Text>
            <Text variant="caption" color="muted">
              Completion rate by category, last {HEATMAP_DAYS} days
            </Text>
            <BarChart
              data={monthlyBreakdown.map((b) => ({ label: CATEGORY_LABELS[b.category], value: b.completionPercent }))}
              maxValue={100}
              color={colors.secondary}
            />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
