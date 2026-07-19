import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/shared/theme';

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 350, easing: Easing.ease }), withTiming(0.3, { duration: 350, easing: Easing.ease })), -1)
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ height: 6, width: 6, borderRadius: 3, backgroundColor: colors.primary }, style]} />;
}

export function TypingDots() {
  return (
    <View className="flex-row items-center gap-1.5 rounded-card rounded-bl-sm bg-surface px-4 py-3.5 dark:bg-surface-dark">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}
