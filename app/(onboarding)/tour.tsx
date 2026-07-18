import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { storage } from '@/shared/lib/storage';

interface TourStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    icon: 'compass-outline',
    title: 'Welcome to Mission365',
    body: 'This is your daily command center — habits, goals, journal, and focus sessions, all in one place.',
  },
  {
    icon: 'checkmark-done-outline',
    title: 'Build habits that stick',
    body: 'Create a habit, pick a category and icon, and check it off each day from Home to grow your streak.',
  },
  {
    icon: 'barbell-outline',
    title: 'Gym habits get workout ideas',
    body: 'Pick the barbell icon when creating a habit and we\'ll suggest ready-made workouts — push, pull, legs, cardio, and more.',
  },
  {
    icon: 'alarm-outline',
    title: 'Reminders made easy',
    body: 'Set a reminder time with the built-in clock picker and we\'ll nudge you at the right moment every day.',
  },
  {
    icon: 'trophy-outline',
    title: 'Stay consistent, earn achievements',
    body: 'Track goals, journal your progress, and unlock badges and XP as you build momentum.',
  },
];

export const ONBOARDING_TOUR_SEEN_KEY = 'onboarding_tour_seen';

export default function OnboardingTourScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const finish = () => {
    storage.set(ONBOARDING_TOUR_SEEN_KEY, '1');
    router.replace('/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name={step.icon} size={36} color={colors.primary} />
        </View>
        <View className="gap-2">
          <Text variant="h2" className="text-center">
            {step.title}
          </Text>
          <Text variant="body" color="muted" className="text-center">
            {step.body}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-center gap-2 pb-6">
        {STEPS.map((s, index) => (
          <View
            key={s.title}
            className={`h-2 rounded-full ${index === stepIndex ? 'w-6 bg-primary' : 'w-2 bg-black/10 dark:bg-white/15'}`}
          />
        ))}
      </View>

      <View className="gap-3 px-8 pb-8">
        <Button
          label={isLastStep ? "Let's Go" : 'Next'}
          variant="primary"
          size="lg"
          onPress={() => (isLastStep ? finish() : setStepIndex((i) => i + 1))}
        />
        {!isLastStep ? <Button label="Skip" variant="ghost" size="md" onPress={finish} /> : null}
      </View>
    </SafeAreaView>
  );
}
