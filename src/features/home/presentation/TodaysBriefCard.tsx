import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/ui';
import { formatDurationMinutes, formatTime12h } from '@/shared/lib/date';
import type { HomeBrief } from '../application/useHomeBrief';

export interface TodaysBriefCardProps {
  brief: HomeBrief;
  currentStreak: number;
  xp: number;
  level: number;
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-1 gap-1">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color="#FFFFFF" />
        <Text variant="caption" className="text-white/70">
          {label}
        </Text>
      </View>
      <Text variant="h3" color="inverse" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function TodaysBriefCard({ brief, currentStreak, xp, level }: TodaysBriefCardProps) {
  const { currentGoal, currentMilestone, completionPercent, remainingMinutes, nextReminder } = brief;

  return (
    <View className="overflow-hidden rounded-card bg-primary p-5 shadow-elevation-md">
      <View
        pointerEvents="none"
        className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/5"
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Text variant="h3" color="inverse">
            🔥 Day {currentStreak}
          </Text>
        </View>
        <View className="rounded-full bg-white/15 px-3 py-1">
          <Text variant="caption" color="inverse">
            Level {level}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-1">
        <Text variant="caption" className="text-white/70">
          GOAL
        </Text>
        <Text variant="h2" color="inverse" numberOfLines={1}>
          {currentGoal?.title ?? 'Set your first goal'}
        </Text>
        {currentMilestone ? (
          <View className="mt-0.5 flex-row items-center gap-1">
            <Ionicons name="location" size={13} color="#FFFFFF" />
            <Text variant="bodySmall" className="text-white/85">
              {currentMilestone.title}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-5 flex-row">
        <Stat icon="checkmark-circle-outline" label="Today's Progress" value={`${Math.round(completionPercent)}%`} />
        <Stat icon="time-outline" label="Time Left" value={formatDurationMinutes(remainingMinutes)} />
        <Stat icon="star-outline" label="Total XP" value={String(xp)} />
      </View>

      {nextReminder ? (
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5">
          <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
          <Text variant="bodySmall" color="inverse" className="flex-1" numberOfLines={1}>
            Next: {nextReminder.mission.habit.name}
          </Text>
          <Text variant="bodySmall" color="inverse">
            {formatTime12h(nextReminder.mission.habit.reminderTime as string)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
