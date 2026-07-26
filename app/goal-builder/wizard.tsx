import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Chip, DatePickerInput, Input, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useGoalBuilderStore } from '@/features/goals/application/goalBuilder.store';
import type { DailyTimeBudget, GoalCurrentLevel, PreferredWorkingHours } from '@/features/roadmaps/types/roadmap.types';

const TOTAL_STEPS = 5;

const LEVELS: { value: GoalCurrentLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// Same 1-5 scale and default as the manual Goal-creation flow and the
// backend's Goal.importance schema - both creation flows must stay
// behaviorally identical (Sprint 7).
const IMPORTANCE_LEVELS: { value: number; label: string }[] = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Mild' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Critical' },
];

const TIME_BUDGETS: { value: DailyTimeBudget; label: string }[] = [
  { value: 'under_30', label: 'Under 30 min/day' },
  { value: '30_60', label: '30-60 min/day' },
  { value: '1_2h', label: '1-2 hours/day' },
  { value: '2h_plus', label: '2+ hours/day' },
];

const WORKING_HOURS: { value: PreferredWorkingHours; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { value: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
  { value: 'evening', label: 'Evening', icon: 'cloudy-night-outline' },
  { value: 'night', label: 'Night', icon: 'moon-outline' },
];

const CHALLENGES = [
  'Lack of time',
  'Staying motivated',
  'Consistency',
  'Not sure where to start',
  'Distractions & procrastination',
  'Lack of resources or knowledge',
];

function StepDots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border dark:bg-border-dark'}`}
        />
      ))}
    </View>
  );
}

export default function GoalBuilderWizardScreen() {
  const [step, setStep] = useState(1);
  const {
    goalTitle,
    targetDeadline,
    importance,
    currentLevel,
    dailyTimeBudget,
    preferredWorkingHours,
    challenges,
    update,
  } = useGoalBuilderStore();
  const [customChallenge, setCustomChallenge] = useState('');

  const toggleWorkingHour = (value: PreferredWorkingHours) => {
    update({
      preferredWorkingHours: preferredWorkingHours.includes(value)
        ? preferredWorkingHours.filter((v) => v !== value)
        : [...preferredWorkingHours, value],
    });
  };

  const toggleChallenge = (value: string) => {
    update({
      challenges: challenges.includes(value)
        ? challenges.filter((v) => v !== value)
        : [...challenges, value],
    });
  };

  const addCustomChallenge = () => {
    const trimmed = customChallenge.trim();
    if (trimmed && !challenges.includes(trimmed)) {
      update({ challenges: [...challenges, trimmed] });
    }
    setCustomChallenge('');
  };

  const canAdvance =
    step === 1 ? goalTitle.trim().length > 0 : step === 2 ? Boolean(targetDeadline) : true;

  const onNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    router.push('/goal-builder/roadmap');
  };

  const onBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="gap-4 px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.muted} />
          </Pressable>
          <Text variant="bodySmall" color="muted">
            Step {step} of {TOTAL_STEPS}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/home')}>
            <Text variant="bodySmall" color="primary">
              Skip
            </Text>
          </Pressable>
        </View>
        <StepDots step={step} />
        <Text variant="h1">Let&apos;s build your goal</Text>
      </View>

      <ScrollView contentContainerClassName="flex-grow gap-5 px-6 py-6" keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <View className="gap-2">
            <Text variant="bodySmall" color="muted">
              What is your main goal?
            </Text>
            <Input
              placeholder="Example: Lose 10kg, Become React Architect, Launch Startup"
              value={goalTitle}
              onChangeText={(text) => update({ goalTitle: text })}
              multiline
              numberOfLines={3}
              className="h-24 py-3"
              textAlignVertical="top"
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-6">
            <DatePickerInput
              label="Target deadline"
              value={targetDeadline}
              onChange={(value) => update({ targetDeadline: value })}
              minimumDate={new Date()}
            />
            <View className="gap-2">
              <Text variant="bodySmall" color="muted">
                Current level
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {LEVELS.map((level) => (
                  <Chip
                    key={level.value}
                    label={level.label}
                    selected={currentLevel === level.value}
                    onPress={() => update({ currentLevel: level.value })}
                  />
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Text variant="bodySmall" color="muted">
                Importance
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {IMPORTANCE_LEVELS.map((level) => (
                  <Chip
                    key={level.value}
                    label={level.label}
                    selected={importance === level.value}
                    onPress={() => update({ importance: level.value })}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View className="gap-2">
            <Text variant="bodySmall" color="muted">
              How much time can you give this daily?
            </Text>
            <View className="gap-2">
              {TIME_BUDGETS.map((budget) => (
                <Chip
                  key={budget.value}
                  label={budget.label}
                  selected={dailyTimeBudget === budget.value}
                  onPress={() => update({ dailyTimeBudget: budget.value })}
                  className="self-start"
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View className="gap-2">
            <Text variant="bodySmall" color="muted">
              When do you prefer to work on this? Select all that apply.
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {WORKING_HOURS.map((hour) => {
                const selected = preferredWorkingHours.includes(hour.value);
                return (
                  <Pressable
                    key={hour.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => toggleWorkingHour(hour.value)}
                    className={`w-[47%] items-center gap-2 rounded-card border py-5 ${
                      selected ? 'border-primary bg-primary/10' : 'border-border dark:border-border-dark'
                    }`}
                  >
                    <Ionicons name={hour.icon} size={22} color={selected ? colors.primary : colors.muted} />
                    <Text variant="bodySmall">{hour.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View className="gap-4">
            <View className="gap-2">
              <Text variant="bodySmall" color="muted">
                What&apos;s getting in your way? Select all that apply.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CHALLENGES.map((challenge) => (
                  <Chip
                    key={challenge}
                    label={challenge}
                    selected={challenges.includes(challenge)}
                    onPress={() => toggleChallenge(challenge)}
                  />
                ))}
                {challenges
                  .filter((c) => !CHALLENGES.includes(c))
                  .map((challenge) => (
                    <Chip key={challenge} label={challenge} selected onPress={() => toggleChallenge(challenge)} />
                  ))}
              </View>
            </View>
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Input
                  label="Something else? (optional)"
                  placeholder="Add your own"
                  value={customChallenge}
                  onChangeText={setCustomChallenge}
                  onSubmitEditing={addCustomChallenge}
                />
              </View>
              <Pressable
                onPress={addCustomChallenge}
                hitSlop={8}
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="gap-3 px-6 pb-4 pt-2">
        <Button
          label={step === TOTAL_STEPS ? 'Build My Roadmap' : 'Next'}
          variant="primary"
          size="lg"
          disabled={!canAdvance}
          onPress={onNext}
        />
        <Pressable accessibilityRole="button" onPress={() => router.replace('/home')}>
          <Text variant="bodySmall" color="muted" className="text-center">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
