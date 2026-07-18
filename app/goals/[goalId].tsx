import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Checkbox, IconButton, Input, ModalHeader, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import {
  useDeleteGoal,
  useGoals,
  useSetMilestone,
  useUpdateGoalProgress,
} from '@/features/goals/application/goal.hooks';

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { data: goals } = useGoals();
  const goal = goals?.find((g) => g._id === goalId);
  const updateProgress = useUpdateGoalProgress();
  const setMilestone = useSetMilestone();
  const deleteGoal = useDeleteGoal();
  const [progressDraft, setProgressDraft] = useState('');

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Text color="muted">Goal not found.</Text>
      </SafeAreaView>
    );
  }

  const percent = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

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
        title="Goal Details"
        rightAction={
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="h2">{goal.title}</Text>
          <ProgressBar percent={percent} color={goal.color} />
          <Text variant="body" color="muted">
            {goal.currentValue} / {goal.targetValue} {goal.unit} ({Math.round(percent)}%)
          </Text>
          {goal.status === 'completed' ? (
            <Text variant="bodySmall" color="success">
              🎉 Goal completed!
            </Text>
          ) : null}
        </View>

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
            {goal.milestones.map((milestone) => (
              <Card key={milestone._id} className="flex-row items-center gap-3">
                <Checkbox
                  checked={milestone.completed}
                  onPress={() =>
                    setMilestone.mutate({
                      goalId: goal._id,
                      milestoneId: milestone._id,
                      completed: !milestone.completed,
                    })
                  }
                />
                <Text
                  variant="body"
                  className="flex-1"
                  color={milestone.completed ? 'muted' : 'default'}
                >
                  {milestone.title}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}

        <Button label="Close" variant="secondary" size="lg" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
