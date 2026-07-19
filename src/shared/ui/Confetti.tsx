import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

const PARTICLE_COUNT = 14;
const PARTICLE_COLORS = [colors.primary, colors.success, colors.warning, colors.accent, colors.danger];

export interface ConfettiProps {
  /** Increment this number to fire a burst. 0/unchanged renders nothing. */
  trigger: number;
}

function Particle({ index, active }: { index: number; active: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 70 + (index % 3) * 20;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  useEffect(() => {
    if (!active) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: '50%', left: '50%', height: 8, width: 8, borderRadius: 4, backgroundColor: color },
        style,
      ]}
    />
  );
}

export function Confetti({ trigger }: ConfettiProps) {
  if (trigger <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle key={`${trigger}-${i}`} index={i} active={trigger > 0} />
      ))}
    </View>
  );
}
