import { Pressable, type PressableProps } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
  className?: string;
}

export function Chip({ label, selected = false, className, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'rounded-full border px-4 py-2',
        selected ? 'border-primary bg-primary' : 'border-border dark:border-border-dark',
        className
      )}
      {...props}
    >
      <Text variant="bodySmall" color={selected ? 'inverse' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}
