import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, Checkbox, EmptyState, ErrorState, MissionCardSkeleton, ModalHeader, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useMissions } from '@/features/missions/hooks/useMissions';
import { useMissionActions } from '@/features/missions/hooks/useMissionActions';
import type { Mission } from '@/features/missions/types/mission.types';
import { useGoals } from '@/features/goals/application/goal.hooks';
import { pickFirstMission } from '@/features/decision-engine/domain/decisionEngine';
import { describeReason } from '@/features/decision-engine/presentation/reasonCopy';
import type { DecisionReason } from '@/features/decision-engine/domain/types';

export default function TodayScreen() {
  const { data: missions, isLoading, isError, refetch } = useMissions();
  const { data: activeGoals } = useGoals('active');
  const { completeMission, skipMission } = useMissionActions();

  const list = missions ?? [];
  const completedCount = list.filter((m) => m.completedToday).length;
  const progressPercent = list.length > 0 ? (completedCount / list.length) * 100 : 0;

  const decision = useMemo(
    () => pickFirstMission(missions ?? [], activeGoals ?? []),
    [missions, activeGoals]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Today" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
        {!isLoading && decision.mission ? (
          <RecommendedMissionCard mission={decision.mission} reasons={decision.reasons} />
        ) : null}

        {!isLoading && list.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="bodySmall" color="muted">
                Today&rsquo;s progress
              </Text>
              <Text variant="bodySmall" color="muted">
                {completedCount} / {list.length} complete
              </Text>
            </View>
            <ProgressBar percent={progressPercent} />
          </View>
        ) : null}

        <View className="gap-3">
          {isLoading ? (
            <>
              <MissionCardSkeleton />
              <MissionCardSkeleton />
              <MissionCardSkeleton />
            </>
          ) : isError ? (
            <Card>
              <ErrorState description="Couldn't load today's missions. Check your connection and try again." onRetry={() => refetch()} />
            </Card>
          ) : list.length === 0 ? (
            <Card>
              <EmptyState
                icon="sunny-outline"
                title="Nothing on today yet"
                description="Add a mission to see it here."
                actionLabel="Add a mission"
                onAction={() => router.push('/habits/new')}
              />
            </Card>
          ) : (
            list.map((mission) => (
              <TodayMissionRow
                key={mission.id}
                mission={mission}
                onComplete={(completed) => completeMission(mission, completed)}
                onSkip={(skipped) => skipMission(mission, skipped)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendedMissionCard({ mission, reasons }: { mission: Mission; reasons: DecisionReason[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="gap-2 border border-primary/15" bordered>
      <Text variant="caption" color="muted">
        RECOMMENDED FIRST MISSION
      </Text>
      <Text variant="h3" numberOfLines={1}>
        {mission.title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-1 self-start"
      >
        <Text variant="bodySmall" color="primary">
          Why this first?
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
      </Pressable>

      {expanded ? (
        <View className="gap-1 pt-1">
          {reasons.map((reason, index) => (
            <Text key={`${reason.code}-${index}`} variant="bodySmall" color="muted">
              {'•'} {describeReason(reason)}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function TodayMissionRow({
  mission,
  onComplete,
  onSkip,
}: {
  mission: Mission;
  onComplete: (completed: boolean) => void;
  onSkip: (skipped: boolean) => void;
}) {
  if (mission.skippedToday) {
    return (
      <Card className="flex-row items-center justify-between opacity-60">
        <View className="flex-1 gap-0.5 pr-3">
          <Text variant="body" numberOfLines={1}>
            {mission.title}
          </Text>
          <Text variant="caption" color="muted">
            Not today
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => onSkip(false)} hitSlop={8}>
          <Text variant="bodySmall" color="primary">
            Undo
          </Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card className="flex-row items-center gap-3">
      <Checkbox checked={mission.completedToday} onPress={() => onComplete(!mission.completedToday)} />
      <Text
        variant="body"
        numberOfLines={1}
        className={mission.completedToday ? 'flex-1 line-through' : 'flex-1'}
        color={mission.completedToday ? 'muted' : 'default'}
      >
        {mission.title}
      </Text>
      {!mission.completedToday ? (
        <Pressable accessibilityRole="button" onPress={() => onSkip(true)} hitSlop={8}>
          <Text variant="bodySmall" color="muted">
            Not today
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
