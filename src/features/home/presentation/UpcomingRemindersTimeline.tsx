import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Text } from '@/shared/ui';
import { asIoniconName } from '@/shared/lib/icon-name';
import { formatTime12h } from '@/shared/lib/date';
import type { BriefMission } from '../application/useHomeBrief';

export interface UpcomingRemindersTimelineProps {
  missions: BriefMission[];
}

export function UpcomingRemindersTimeline({ missions }: UpcomingRemindersTimelineProps) {
  const withReminders = missions
    .filter((m) => m.mission.habit.reminderTime)
    .sort((a, b) => (a.mission.habit.reminderTime! < b.mission.habit.reminderTime! ? -1 : 1));

  if (withReminders.length === 0) return null;

  return (
    <Card className="gap-4">
      <Text variant="h3">Upcoming Reminders</Text>
      <View className="gap-0">
        {withReminders.map((item, index) => (
          <View key={item.mission.habit._id} className="flex-row gap-3">
            <View className="items-center">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: `${item.mission.habit.color}22` }}
              >
                <Ionicons name={asIoniconName(item.mission.habit.icon)} size={15} color={item.mission.habit.color} />
              </View>
              {index < withReminders.length - 1 ? <View className="w-px flex-1 bg-border dark:bg-border-dark" /> : null}
            </View>
            <View className="flex-1 pb-4">
              <Text variant="bodySmall" color="muted">
                {formatTime12h(item.mission.habit.reminderTime as string)}
              </Text>
              <Text variant="body">{item.mission.habit.name}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
