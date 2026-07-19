import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { colors } from '../theme';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  children?: ReactNode;
}

export function CircularProgress({
  percent,
  size = 150,
  strokeWidth = 12,
  color = colors.primary,
  trackColor = colors.border.light,
  label,
  children,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedPercent = useSharedValue(0);

  useEffect(() => {
    animatedPercent.value = withTiming(clamped, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [clamped, animatedPercent]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedPercent.value / 100) * circumference,
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ maxWidth: size * 0.7 }} className="items-center">
        {children ?? (
          <>
            <Text variant="h2">{Math.round(clamped)}%</Text>
            {label ? (
              <Text variant="caption" color="muted" numberOfLines={1} className="text-center">
                {label}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
