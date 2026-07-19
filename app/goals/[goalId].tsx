import { useEffect, useRef, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Checkbox, Confetti, IconButton, Input, ModalHeader, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import {
  useDeleteGoal,
  useGoals,
  useSetMilestone,
  useUpdateGoalProgress,
} from '@/features/goals/application/goal.hooks';
import { getGoalPacing } from '@/features/goals/domain/goalPacing';
import type { Milestone } from '@/features/goals/domain/types';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { data: goals } = useGoals();
  const goal = goals?.find((g) => g._id === goalId);
  const updateProgress = useUpdateGoalProgress();
  const setMilestone = useSetMilestone();
  const deleteGoal = useDeleteGoal();
  const [progressDraft, setProgressDraft] = useState('');
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const prevProgressPercent = useRef<number | null>(null);

  const liveProgressPercent =
    goal && goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : null;

  useEffect(() => {
    if (liveProgressPercent === null) return;
    const prev = prevProgressPercent.current;
    if (prev !== null && prev < 100 && liveProgressPercent >= 100) {
      setConfettiTrigger((t) => t + 1);
    }
    prevProgressPercent.current = liveProgressPercent;
  }, [liveProgressPercent]);

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Text color="muted">Goal not found.</Text>
      </SafeAreaView>
    );
  }

  const pacing = getGoalPacing(goal);
  const confidenceColor = pacing.confidencePercent >= 60 ? 'success' : pacing.confidencePercent >= 35 ? 'warning' : 'danger';

  // Milestones don't carry individual target dates, so "today" is placed
  // proportionally along the milestone sequence using elapsed time through
  // the goal's overall date range — an honest approximation, not exact dates.
  const todayIndex =
    pacing.elapsedPercent !== null && goal.milestones.length > 0
      ? Math.max(0, Math.min(goal.milestones.length, Math.round((pacing.elapsedPercent / 100) * goal.milestones.length)))
      : null;

  const onDelete = async () => {
    await deleteGoal.mutateAsync(goal._id);
    router.back();
  };

  const onUpdateProgress = async () => {
    const value = Number(progressDraft);
    if (Number.isNaN(value) || value < 0) return;
    await updateProgress.mutateAsync({ goalId: goal._id, currentValue: value });
    setProgressDraft('');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader
        title="Roadmap"
        rightAction={
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="h2">{goal.title}</Text>
          <ProgressBar percent={pacing.progressPercent} color={goal.color} />
          <View className="flex-row items-center justify-between">
            <Text variant="body" color="muted">
              {goal.currentValue} / {goal.targetValue} {goal.unit} ({Math.round(pacing.progressPercent)}%)
            </Text>
            <Text variant="bodySmall" color={confidenceColor}>
              {pacing.confidencePercent}% pace · {pacing.phase}
            </Text>
          </View>
          {goal.status === 'completed' ? (
            <Text variant="bodySmall" color="success">
              🎉 Goal completed!
            </Text>
          ) : null}
        </View>

        <Card className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="muted">
              Started {new Date(goal.createdAt).toLocaleDateString(undefined, DATE_FORMAT)}
            </Text>
            <Text variant="caption" color="muted">
              {goal.deadline ? new Date(goal.deadline).toLocaleDateString(undefined, DATE_FORMAT) : 'No deadline'}
            </Text>
          </View>
          {pacing.elapsedPercent !== null ? (
            <View className="h-1.5 overflow-hidden rounded-full bg-border dark:bg-border-dark">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${pacing.elapsedPercent}%` }}
              />
            </View>
          ) : null}
          <Text variant="caption" color="muted">
            {pacing.elapsedPercent !== null ? 'Current position through your timeline' : 'Set a deadline to see your timeline position'}
          </Text>
        </Card>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Update Progress
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                placeholder={`Current: ${goal.currentValue}`}
                keyboardType="numeric"
                value={progressDraft}
                onChangeText={setProgressDraft}
              />
            </View>
            <IconButton icon="checkmark" accessibilityLabel="Save progress" onPress={onUpdateProgress} />
          </View>
        </View>

        {goal.milestones.length > 0 ? (
          <View className="gap-2">
            <Text variant="bodySmall" color="muted">
              Milestones
            </Text>
            <Card className="gap-0">
              {goal.milestones.map((milestone, index) => (
                <MilestoneRow
                  key={milestone._id}
                  milestone={milestone}
                  isLast={index === goal.milestones.length - 1}
                  showTodayMarker={todayIndex === index}
                  onToggle={() =>
                    setMilestone.mutate({
                      goalId: goal._id,
                      milestoneId: milestone._id,
                      completed: !milestone.completed,
                    })
                  }
                />
              ))}
              {todayIndex === goal.milestones.length ? <TodayMarker /> : null}
            </Card>
          </View>
        ) : null}

        <Button label="Close" variant="secondary" size="lg" onPress={() => router.back()} />
      </ScrollView>
      <Confetti trigger={confettiTrigger} />
    </SafeAreaView>
  );
}

function TodayMarker() {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="h-2 w-2 rounded-full bg-primary" />
      <View className="h-px flex-1 bg-primary/40" />
      <Text variant="caption" color="primary">
        TODAY
      </Text>
      <View className="h-px flex-1 bg-primary/40" />
    </View>
  );
}

function MilestoneRow({
  milestone,
  isLast,
  showTodayMarker,
  onToggle,
}: {
  milestone: Milestone;
  isLast: boolean;
  showTodayMarker: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {showTodayMarker ? <TodayMarker /> : null}
      <View className="flex-row gap-3">
        <View className="items-center">
          <Checkbox checked={milestone.completed} onPress={onToggle} size={22} />
          {isLast ? null : <View className="w-px flex-1 bg-border dark:bg-border-dark" />}
        </View>
        <View className="flex-1 pb-4">
          <Text variant="body" color={milestone.completed ? 'muted' : 'default'}>
            {milestone.title}
          </Text>
        </View>
      </View>
    </>
  );
}
