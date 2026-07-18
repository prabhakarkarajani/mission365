import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from './cn';
import type { IoniconName } from '../lib/icon-name';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: IoniconName;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  variant?: 'primary' | 'transparent';
  className?: string;
}

export function IconButton({
  icon,
  size = 40,
  iconSize = 22,
  iconColor = '#FFFFFF',
  variant = 'primary',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'items-center justify-center rounded-full',
        variant === 'primary' ? 'bg-primary' : 'bg-transparent',
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}
