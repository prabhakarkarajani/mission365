import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from './cn';

export interface CheckboxProps extends Omit<PressableProps, 'children'> {
  checked: boolean;
  size?: number;
  className?: string;
}

export function Checkbox({ checked, size = 28, className, ...props }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={cn(
        'items-center justify-center rounded-full border-2',
        checked ? 'border-success bg-success' : 'border-border dark:border-border-dark',
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {checked ? <Ionicons name="checkmark" size={size * 0.65} color="#FFFFFF" /> : null}
    </Pressable>
  );
}
