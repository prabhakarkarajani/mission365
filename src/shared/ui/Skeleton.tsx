import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { cn } from './cn';

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.ease }),
        withTiming(0.5, { duration: 700, easing: Easing.ease })
      ),
      -1
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={cn('rounded-control bg-black/10 dark:bg-white/10', className)}
      style={[style, animatedStyle]}
      {...props}
    />
  );
}

export function MissionCardSkeleton() {
  return (
    <View className="gap-3 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark">
      <View className="flex-row items-center gap-3">
        <Skeleton style={{ height: 44, width: 44, borderRadius: 22 }} />
        <View className="flex-1 gap-2">
          <Skeleton style={{ height: 14, width: '60%' }} />
          <Skeleton style={{ height: 10, width: '35%' }} />
        </View>
      </View>
    </View>
  );
}
