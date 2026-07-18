import { View, type ViewProps } from 'react-native';

import { colors } from '../theme';

export interface ProgressBarProps extends ViewProps {
  percent: number;
  color?: string;
  trackColor?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  percent,
  color = colors.primary,
  trackColor = colors.border.light,
  height = 8,
  className,
  ...props
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      className={className}
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }}
      {...props}
    >
      <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}
