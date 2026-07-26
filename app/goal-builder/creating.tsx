import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useGoalBuilderStore } from '@/features/goals/application/goalBuilder.store';
import { useCreateGoal } from '@/features/goals/application/goal.hooks';
import { useCreateHabit } from '@/features/habits/application/habit.hooks';
import { getGoalCategory } from '@/features/goals/domain/categories';
import type { HabitCategory } from '@/features/habits/domain/types';
import type { PreferredWorkingHours } from '@/features/roadmaps/types/roadmap.types';

const CATEGORY_TO_HABIT: Record<string, HabitCategory> = {
  health: 'health',
  learning: 'learn',
};

const WORKING_HOUR_TIME: Record<PreferredWorkingHours, string> = {
  morning: '07:00',
  afternoon: '13:00',
  evening: '18:00',
  night: '21:00',
};

type StepStatus = 'pending' | 'active' | 'done' | 'error';

export default function CreatingScreen() {
  const { skipMissions } = useLocalSearchParams<{ skipMissions?: string }>();
  const { goalTitle, selectedCategories, targetDeadline, importance, roadmap, preferredWorkingHours, reset } =
    useGoalBuilderStore();
  const createGoal = useCreateGoal();
  const createHabit = useCreateHabit();
  const started = useRef(false);

  const [goalStatus, setGoalStatus] = useState<StepStatus>('pending');
  const [missionStatus, setMissionStatus] = useState<StepStatus>(skipMissions === '1' ? 'done' : 'pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (started.current || !roadmap) return;
    started.current = true;

    const category = getGoalCategory(selectedCategories[0]);

    async function run() {
      setGoalStatus('active');
      try {
        await createGoal.mutateAsync({
          title: goalTitle,
          category: category?.id ?? 'general',
          icon: category?.icon,
          color: category?.color,
          targetValue: 100,
          unit: '%',
          importance,
          deadline: targetDeadline ?? null,
          milestones: roadmap!.milestones.map((m) => ({ title: m.title })),
        });
        setGoalStatus('done');
      } catch {
        setGoalStatus('error');
        setErrorMessage('Could not save your goal, but you can add it manually from the Goals tab.');
      }

      if (skipMissions === '1') {
        finish();
        return;
      }

      setMissionStatus('active');
      const habitCategory = CATEGORY_TO_HABIT[category?.id ?? ''] ?? 'other';
      const reminderTime = preferredWorkingHours[0] ? WORKING_HOUR_TIME[preferredWorkingHours[0]] : null;
      const dailyMissions = roadmap!.firstWeekMissions.filter((m) => m.type === 'DAILY');

      try {
        for (const mission of dailyMissions) {
          await createHabit.mutateAsync({
            name: mission.title,
            category: habitCategory,
            icon: category?.icon,
            color: category?.color,
            frequency: { type: 'daily' },
            reminderTime,
          });
        }
        setMissionStatus('done');
      } catch {
        setMissionStatus('error');
        setErrorMessage('Your goal was saved, but some missions could not be created. Add them from the Habits tab.');
      }

      finish();
    }

    function finish() {
      setTimeout(() => {
        reset();
        router.replace('/home');
      }, 900);
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap]);

  if (!roadmap) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Stack.Screen options={{ headerShown: false }} />
        <Button label="Back" variant="ghost" onPress={() => router.replace('/goal-builder/roadmap')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center gap-8 px-8">
        <Text variant="h1" className="text-center">
          Setting up your journey
        </Text>

        <View className="w-full gap-4">
          <SetupStep label="Creating your goal & milestones" status={goalStatus} />
          <SetupStep
            label={skipMissions === '1' ? "First week missions skipped — add them anytime" : 'Generating your first week of missions'}
            status={missionStatus}
          />
        </View>

        {errorMessage ? (
          <Text color="danger" variant="bodySmall" className="text-center">
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function SetupStep({ label, status }: { label: string; status: StepStatus }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        {status === 'active' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : status === 'done' ? (
          <Ionicons name="checkmark" size={18} color={colors.success} />
        ) : status === 'error' ? (
          <Ionicons name="alert" size={18} color={colors.danger} />
        ) : (
          <View className="h-2 w-2 rounded-full bg-border dark:bg-border-dark" />
        )}
      </View>
      <Text variant="body" color={status === 'pending' ? 'muted' : 'default'}>
        {label}
      </Text>
    </View>
  );
}
