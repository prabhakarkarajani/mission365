import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';

import { useAchievementToastStore } from '../application/achievement-toast.store';

const AUTO_DISMISS_MS = 3500;

export function AchievementToast() {
  const queue = useAchievementToastStore((s) => s.queue);
  const shift = useAchievementToastStore((s) => s.shift);
  const insets = useSafeAreaInsets();
  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(shift, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [current, shift]);

  if (!current) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8 }}
      className="items-center px-4"
    >
      <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
        <Pressable
          onPress={shift}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-2xl bg-[#1A1730] px-4 py-3"
          style={{ maxWidth: 360 }}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-warning/20">
            <Ionicons name={asIoniconName(current.icon)} size={20} color={colors.warning} />
          </View>
          <View className="flex-1">
            <Text variant="bodySmall" color="inverse">
              Achievement Unlocked!
            </Text>
            <Text variant="caption" color="inverse">
              {current.title}
              {current.xpReward > 0 ? ` · +${current.xpReward} XP` : ''}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
