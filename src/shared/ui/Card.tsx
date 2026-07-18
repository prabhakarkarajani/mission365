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
        'rounded-2xl bg-surface p-4 dark:bg-surface-dark',
        bordered && 'border border-border dark:border-border-dark',
        className
      )}
      {...props}
    />
  );
}
