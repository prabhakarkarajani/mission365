import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Card, CircularProgress, LoadingState, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useGoalBuilderStore } from '@/features/goals/application/goalBuilder.store';
import { useGenerateRoadmap } from '@/features/coach/hooks/useGenerateRoadmap';
import { getGoalCategory } from '@/features/goals/domain/categories';

export default function AIRoadmapScreen() {
  const {
    goalTitle,
    selectedCategories,
    targetDeadline,
    currentLevel,
    dailyTimeBudget,
    preferredWorkingHours,
    challenges,
    roadmap,
    update,
  } = useGoalBuilderStore();
  const generateRoadmap = useGenerateRoadmap();

  const triggerGenerate = () => {
    generateRoadmap.mutate(
      {
        goalTitle,
        goalCategory: getGoalCategory(selectedCategories[0])?.label,
        targetDate: targetDeadline,
        currentLevel,
        dailyTimeBudget,
        preferredWorkingHours,
        challenges,
      },
      {
        onSuccess: (result) => update({ roadmap: result }),
      }
    );
  };

  useEffect(() => {
    if (roadmap || generateRoadmap.isPending || generateRoadmap.isSuccess || generateRoadmap.isError) return;
    triggerGenerate();
    // Runs once on mount — the wizard inputs are fixed by the time this screen is reached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    update({ roadmap: null });
    triggerGenerate();
  };

  const isLoading = !roadmap && (generateRoadmap.isPending || generateRoadmap.isIdle);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="gap-1 px-6 pt-4">
        <Text variant="bodySmall" color="muted">
          Goal: {goalTitle}
        </Text>
        <Text variant="h1">Here&apos;s your AI Roadmap</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <LoadingState label="Building your personalized roadmap..." />
        </View>
      ) : generateRoadmap.isError && !roadmap ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text color="danger" variant="body" className="text-center">
            Could not build your roadmap. Please try again.
          </Text>
          <Button label="Retry" variant="primary" onPress={retry} />
        </View>
      ) : roadmap ? (
        <>
          <ScrollView contentContainerClassName="gap-5 px-6 py-5">
            <Card className="flex-row items-center justify-around py-5">
              <CircularProgress
                percent={roadmap.estimatedSuccessPercent}
                size={110}
                strokeWidth={10}
                label="Success chance"
              />
              <View className="items-center gap-1">
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                <Text variant="h2">{roadmap.timelineDays}</Text>
                <Text variant="caption" color="muted">
                  Days Timeline
                </Text>
              </View>
            </Card>

            <Card className="gap-2">
              <Text variant="bodySmall" color="muted">
                Summary
              </Text>
              <Text variant="body">{roadmap.summary}</Text>
            </Card>

            <View className="gap-2">
              <Text variant="h3">Milestones</Text>
              <Card className="gap-4">
                {roadmap.milestones.map((milestone, index) => (
                  <View key={milestone.title} className="flex-row items-start gap-3">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Text variant="caption" color="primary">
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text variant="body">{milestone.title}</Text>
                        <Badge label={`Day ${milestone.targetOffsetDays}`} color="muted" />
                      </View>
                      {milestone.description ? (
                        <Text variant="bodySmall" color="muted">
                          {milestone.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </Card>
            </View>

            <View className="gap-2">
              <Text variant="h3">First Week Plan</Text>
              <Card className="gap-3">
                {roadmap.firstWeekMissions.map((mission, index) => (
                  <View key={`${mission.title}-${index}`} className="flex-row items-center gap-3">
                    <Badge label={`Day ${(mission.dayOffset ?? index) + 1}`} color="primary" />
                    <Text variant="bodySmall" className="flex-1">
                      {mission.title}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          </ScrollView>

          <View className="gap-3 px-6 pb-4 pt-2">
            <Button
              label="Start My Journey"
              variant="primary"
              size="lg"
              onPress={() => router.push('/goal-builder/creating')}
            />
            <Button
              label="Save Roadmap"
              variant="ghost"
              size="lg"
              onPress={() => router.push({ pathname: '/goal-builder/creating', params: { skipMissions: '1' } })}
            />
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}
