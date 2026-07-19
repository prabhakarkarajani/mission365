import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, EmptyState, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import type { Goal, Milestone } from '@/features/goals/domain/types';

export interface CurrentGoalCardProps {
  goal: Goal | null;
  milestone: Milestone | null;
  daysRemaining: number | null;
}

export function CurrentGoalCard({ goal, milestone, daysRemaining }: CurrentGoalCardProps) {
  if (!goal) {
    return (
      <Card>
        <EmptyState
          icon="flag-outline"
          title="No active goal yet"
          description="Set a goal so Mission365 can build your roadmap."
          actionLabel="Set your first goal"
          onAction={() => router.push('/goals/new')}
        />
      </Card>
    );
  }

  const percent = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1 pr-2">
          <Text variant="caption" color="muted">
            CURRENT GOAL
          </Text>
          <Text variant="h3" numberOfLines={1}>
            {goal.title}
          </Text>
        </View>
        <Text variant="h3" color="primary">
          {Math.round(percent)}%
        </Text>
      </View>

      <ProgressBar percent={percent} color={goal.color} />

      <View className="flex-row items-center justify-between">
        {daysRemaining !== null ? (
          <Text variant="caption" color="muted">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
          </Text>
        ) : (
          <Text variant="caption" color="muted">
            No deadline set
          </Text>
        )}
        {milestone ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text variant="caption" color="muted" numberOfLines={1}>
              {milestone.title}
            </Text>
          </View>
        ) : null}
      </View>

      <Button label="View Roadmap" variant="secondary" size="sm" onPress={() => router.push(`/goals/${goal._id}`)} />
    </Card>
  );
}
