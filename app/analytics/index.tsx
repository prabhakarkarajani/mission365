import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { BarChart, Card, LineChart, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAnalyticsSummary } from '@/features/analytics/application/analytics.hooks';
import { formatWeekdayShort } from '@/shared/lib/date';

export default function AnalyticsScreen() {
  const { data, isLoading } = useAnalyticsSummary();

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
      <ModalHeader title="Analytics" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
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
      </ScrollView>
    </SafeAreaView>
  );
}
