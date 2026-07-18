import { View, type ViewProps } from 'react-native';

import { cn } from './cn';
import { Text, type TextColor } from './Text';

export interface BadgeProps extends ViewProps {
  label: string;
  color?: TextColor;
  className?: string;
}

const dotColorClasses: Record<TextColor, string> = {
  default: 'bg-black/5 dark:bg-white/10',
  muted: 'bg-black/5 dark:bg-white/10',
  primary: 'bg-primary/10',
  danger: 'bg-danger/10',
  success: 'bg-success/10',
  accent: 'bg-accent/10',
  warning: 'bg-warning/10',
  inverse: 'bg-white/10',
};

export function Badge({ label, color = 'primary', className, ...props }: BadgeProps) {
  return (
    <View
      className={cn('self-start rounded-full px-3 py-1', dotColorClasses[color], className)}
      {...props}
    >
      <Text variant="caption" color={color}>
        {label}
      </Text>
    </View>
  );
}
