import { View, type ViewProps } from 'react-native';

import { cn } from './cn';

export interface CardProps extends ViewProps {
  bordered?: boolean;
  className?: string;
}

export function Card({ bordered = false, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark dark:shadow-none',
        bordered && 'border border-border dark:border-border-dark',
        className
      )}
      {...props}
    />
  );
}
