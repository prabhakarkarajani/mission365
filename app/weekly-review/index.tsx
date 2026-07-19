import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BarChart, Button, Card, LoadingState, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAnalyticsSummary } from '@/features/analytics/application/analytics.hooks';
import { useHabitLogs, useHabits } from '@/features/habits/application/habit.hooks';
import { computeCategoryBreakdown, CATEGORY_LABELS } from '@/features/analytics/domain/categoryBreakdown';
import { buildWeeklyInsight } from '@/features/analytics/domain/weeklyReviewInsight';
import { subtractDays, todayKey } from '@/shared/lib/date';

export default function WeeklyReviewScreen() {
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(7);
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const start = subtractDays(todayKey(), 6);
  const end = todayKey();
  const { data: logs, isLoading: logsLoading } = useHabitLogs(start, end);

  const dates = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 7; i++) out.push(subtractDays(end, 6 - i));
    return out;
  }, [end]);

  const breakdown = useMemo(
    () => (habits && logs ? computeCategoryBreakdown(habits, logs, dates) : []),
    [habits, logs, dates]
  );

  const insight = useMemo(() => buildWeeklyInsight(breakdown), [breakdown]);

  const daysWithData = (summary?.habitCompletionSeries ?? []).filter((d) => d.total > 0);
  const bestDay = daysWithData.length > 0 ? [...daysWithData].sort((a, b) => b.percent - a.percent)[0] : null;
  const worstDay = daysWithData.length > 0 ? [...daysWithData].sort((a, b) => a.percent - b.percent)[0] : null;

  const isLoading = summaryLoading || habitsLoading || logsLoading;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Weekly Review" />
      {isLoading || !summary ? (
        <LoadingState label="Crunching your week..." />
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text variant="h2" color="primary">
                {summary.weeklyHabitCompletionPercent}%
              </Text>
              <Text variant="caption" color="muted">
                Completion
              </Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text variant="h2" color="success">
                {bestDay ? `${bestDay.percent}%` : '—'}
              </Text>
              <Text variant="caption" color="muted">
                Best Day
              </Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text variant="h2" color="danger">
                {worstDay ? `${worstDay.percent}%` : '—'}
              </Text>
              <Text variant="caption" color="muted">
                Worst Day
              </Text>
            </Card>
          </View>

          {breakdown.length > 0 ? (
            <Card className="gap-3">
              <Text variant="h3">Category Breakdown</Text>
              <BarChart
                data={breakdown.map((b) => ({ label: CATEGORY_LABELS[b.category], value: b.completionPercent }))}
                maxValue={100}
                color={colors.primary}
              />
            </Card>
          ) : null}

          <Card className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <Text variant="h3">Coach&apos;s Take</Text>
            </View>
            <Text variant="body" color="muted">
              {insight ?? 'Complete a few missions this week and I\'ll spot patterns here.'}
            </Text>
            <Button label="Ask Maya About This" variant="outline" size="sm" onPress={() => router.push('/coach')} />
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
