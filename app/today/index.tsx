import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Card, Checkbox, EmptyState, MissionCardSkeleton, ModalHeader, ProgressBar, Text } from '@/shared/ui';
import { useMissions } from '@/features/missions/hooks/useMissions';
import { useMissionActions } from '@/features/missions/hooks/useMissionActions';
import type { Mission } from '@/features/missions/types/mission.types';

export default function TodayScreen() {
  const { data: missions, isLoading } = useMissions();
  const { completeMission, skipMission } = useMissionActions();

  const list = missions ?? [];
  const completedCount = list.filter((m) => m.completedToday).length;
  const progressPercent = list.length > 0 ? (completedCount / list.length) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Today" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
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
