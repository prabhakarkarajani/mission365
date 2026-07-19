import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, Checkbox, Text } from '@/shared/ui';
import { asIoniconName } from '@/shared/lib/icon-name';
import { formatDurationMinutes, formatTime12h } from '@/shared/lib/date';
import { getMissionPresentation, PRIORITY_COLOR } from '../domain/missionPresentation';
import type { BriefMission } from '../application/useHomeBrief';

export interface MissionCardProps {
  item: BriefMission;
  onToggle: () => void;
}

export function MissionCard({ item, onToggle }: MissionCardProps) {
  const { mission, priority, durationMinutes } = item;
  const { habit, completed } = mission;
  const presentation = getMissionPresentation(habit.category);

  return (
    <Card className={completed ? 'gap-3 opacity-60' : 'gap-3'}>
      <View className="flex-row items-center gap-3">
        {/* Checkbox is a sibling, not nested inside this Pressable — React
            Native Web doesn't reliably deliver taps to a Pressable nested
            inside another Pressable, so a second interactive control has to
            live outside it rather than wrap it. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/habits/${habit._id}`)}
          className="flex-1 flex-row items-center gap-3"
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            <Ionicons name={asIoniconName(habit.icon)} size={20} color={habit.color} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="body" numberOfLines={1} className={completed ? 'line-through' : undefined}>
              {habit.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text variant="caption" color="muted">
                {presentation.categoryLabel}
              </Text>
              <Text variant="caption" color={PRIORITY_COLOR[priority]}>
                {priority[0]}
                {priority.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
        </Pressable>
        <Checkbox checked={completed} onPress={onToggle} />
      </View>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 pl-14">
        {habit.reminderTime ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text variant="caption" color="muted">
              {formatTime12h(habit.reminderTime)}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-1">
          <Ionicons name="hourglass-outline" size={13} color="#64748B" />
          <Text variant="caption" color="muted">
            {formatDurationMinutes(durationMinutes)}
          </Text>
        </View>
        {habit.currentStreak > 0 ? (
          <Text variant="caption" color="muted">
            🔥 {habit.currentStreak} Day Streak
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
