import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { useAchievements } from '@/features/gamification/application/achievement.hooks';

export interface AchievementStripProps {
  xp: number;
  level: number;
  currentStreak: number;
}

function StripCard({ icon, iconColor, value, label }: { icon: keyof typeof Ionicons.glyphMap; iconColor: string; value: string; label: string }) {
  return (
    <View className="w-28 gap-2 rounded-card bg-surface p-3 shadow-elevation-sm dark:bg-surface-dark">
      <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${iconColor}1A` }}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text variant="h3" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" color="muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function AchievementStrip({ xp, level, currentStreak }: AchievementStripProps) {
  const { data: achievements } = useAchievements();
  const latestBadge = (achievements ?? [])
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => (a.unlockedAt! < b.unlockedAt! ? 1 : -1))[0];

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="h3">Achievements</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/achievements')} hitSlop={8}>
          <Text variant="bodySmall" color="primary">
            View all
          </Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
        <StripCard icon="star" iconColor={colors.primary} value={String(xp)} label="Total XP" />
        <StripCard icon="trophy" iconColor={colors.warning} value={`Lvl ${level}`} label="Level" />
        <StripCard icon="flame" iconColor={colors.danger} value={String(currentStreak)} label="Day Streak" />
        {latestBadge ? (
          <StripCard icon={asIoniconName(latestBadge.icon)} iconColor={colors.success} value={latestBadge.title} label="Latest Badge" />
        ) : null}
      </ScrollView>
    </View>
  );
}
