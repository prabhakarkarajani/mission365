import { useEffect } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';

import { cn } from './cn';

export interface CheckboxProps extends Omit<PressableProps, 'children'> {
  checked: boolean;
  size?: number;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Checkbox({ checked, size = 28, className, ...props }: CheckboxProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) })
      );
    }
  }, [checked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={cn(
        'items-center justify-center rounded-full border-2',
        checked ? 'border-success bg-success' : 'border-border dark:border-border-dark',
        className
      )}
      style={[{ width: size, height: size }, animatedStyle]}
      {...props}
    >
      {checked ? <Ionicons name="checkmark" size={size * 0.65} color="#FFFFFF" /> : null}
    </AnimatedPressable>
  );
}
