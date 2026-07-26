import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, Chip, CircularProgress, EmptyState, ErrorState, IconButton, Skeleton, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useGoals } from '@/features/goals/application/goal.hooks';
import { getGoalPacing } from '@/features/goals/domain/goalPacing';
import { daysUntil } from '@/shared/lib/date';
import type { Goal, GoalStatus } from '@/features/goals/domain/types';

const TABS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function GoalsScreen() {
  const [status, setStatus] = useState<GoalStatus>('active');
  const { data: goals, isLoading, isError, refetch } = useGoals(status);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-6">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Goals</Text>
          <IconButton icon="add" accessibilityLabel="Add goal" onPress={() => router.push('/goals/new')} />
        </View>

        <View className="flex-row gap-2">
          {TABS.map((tab) => (
            <Chip
              key={tab.value}
              label={tab.label}
              selected={status === tab.value}
              onPress={() => setStatus(tab.value)}
            />
          ))}
        </View>

        {isLoading ? (
          <View className="gap-4">
            <View className="gap-3 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark">
              <View className="flex-row items-center gap-4">
                <Skeleton style={{ height: 72, width: 72, borderRadius: 36 }} />
                <View className="flex-1 gap-2">
                  <Skeleton style={{ height: 16, width: '70%' }} />
                  <Skeleton style={{ height: 12, width: '40%' }} />
                </View>
              </View>
            </View>
            <View className="gap-3 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark">
              <View className="flex-row items-center gap-4">
                <Skeleton style={{ height: 72, width: 72, borderRadius: 36 }} />
                <View className="flex-1 gap-2">
                  <Skeleton style={{ height: 16, width: '55%' }} />
                  <Skeleton style={{ height: 12, width: '35%' }} />
                </View>
              </View>
            </View>
          </View>
        ) : isError ? (
          <Card>
            <ErrorState description="Couldn't load your goals. Check your connection and try again." onRetry={() => refetch()} />
          </Card>
        ) : !goals || goals.length === 0 ? (
          <Card>
            <EmptyState
              icon="flag-outline"
              title={`No ${status} goals yet`}
              actionLabel={status === 'active' ? 'Set your first goal' : undefined}
              onAction={status === 'active' ? () => router.push('/goals/new') : undefined}
            />
          </Card>
        ) : (
          goals.map((goal) => <GoalListCard key={goal._id} goal={goal} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalListCard({ goal }: { goal: Goal }) {
  const pacing = getGoalPacing(goal);
  const currentMilestone = goal.milestones.find((m) => !m.completed);
  const daysRemaining = daysUntil(goal.deadline);
  const confidenceColor = !pacing.hasSignal
    ? 'muted'
    : pacing.confidencePercent >= 60
      ? 'success'
      : pacing.confidencePercent >= 35
        ? 'warning'
        : 'danger';

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-4">
        <CircularProgress percent={pacing.progressPercent} size={72} strokeWidth={7} color={goal.color}>
          <Text variant="bodySmall" color="primary">
            {Math.round(pacing.progressPercent)}%
          </Text>
        </CircularProgress>
        <View className="flex-1 gap-1">
          <Text variant="h3" numberOfLines={1}>
            {goal.title}
          </Text>
          <Text variant="caption" color="muted">
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="trending-up-outline" size={12} color={colors[confidenceColor]} />
            <Text variant="caption" color={confidenceColor}>
              {pacing.hasSignal ? `${pacing.confidencePercent}% pace · ${pacing.phase}` : 'Just getting started'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text variant="caption" color="muted">
          {daysRemaining !== null ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining` : 'No deadline set'}
        </Text>
        {currentMilestone ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text variant="caption" color="muted" numberOfLines={1}>
              {currentMilestone.title}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/goals/${goal._id}`)}
        className="flex-row items-center justify-center gap-1.5 rounded-control bg-black/5 py-2.5 dark:bg-white/10"
      >
        <Ionicons name="map-outline" size={15} color={colors.primary} />
        <Text variant="bodySmall" color="primary">
          View Roadmap
        </Text>
      </Pressable>
    </Card>
  );
}
