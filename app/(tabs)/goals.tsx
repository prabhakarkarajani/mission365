import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, Chip, IconButton, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useGoals } from '@/features/goals/application/goal.hooks';
import type { GoalStatus } from '@/features/goals/domain/types';

const TABS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function GoalsScreen() {
  const [status, setStatus] = useState<GoalStatus>('active');
  const { data: goals, isLoading } = useGoals(status);

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
          <Text color="muted">Loading...</Text>
        ) : !goals || goals.length === 0 ? (
          <Card className="items-center gap-2 py-10">
            <Ionicons name="flag-outline" size={32} color={colors.muted} />
            <Text variant="body" color="muted" className="text-center">
              No {status} goals yet.
            </Text>
            {status === 'active' ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/goals/new')}>
                <Text color="primary">Set your first goal</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          goals.map((goal) => {
            const percent = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
            return (
              <Pressable
                key={goal._id}
                accessibilityRole="button"
                onPress={() => router.push(`/goals/${goal._id}`)}
              >
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text variant="h3">{goal.title}</Text>
                    <Text variant="bodySmall" color="primary">
                      {Math.round(percent)}%
                    </Text>
                  </View>
                  <ProgressBar percent={percent} color={goal.color} />
                  <Text variant="caption" color="muted">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </Text>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
