import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/ui';
import type { BriefMission } from '../application/useHomeBrief';

export interface ContinueMissionCTAProps {
  topPendingMission: BriefMission | null;
}

export function ContinueMissionCTA({ topPendingMission }: ContinueMissionCTAProps) {
  if (!topPendingMission) {
    return (
      <View className="flex-row items-center justify-center gap-2 rounded-card bg-success/10 px-5 py-4">
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text variant="body" color="success">
          All of today&apos;s missions are complete
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/habits/${topPendingMission.mission.habit._id}`)}
      className="flex-row items-center gap-3 rounded-card bg-primary px-5 py-4 shadow-elevation-md"
    >
      <Ionicons name="play-circle" size={26} color="#FFFFFF" />
      <View className="flex-1">
        <Text variant="body" color="inverse">
          Continue Today&apos;s Mission
        </Text>
        <Text variant="caption" className="text-white/75" numberOfLines={1}>
          {topPendingMission.mission.habit.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </Pressable>
  );
}
