import { View, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from './cn';
import { colors } from '../theme';
import { Button } from './Button';
import { Text } from './Text';
import type { IoniconName } from '../lib/icon-name';

export interface EmptyStateProps extends ViewProps {
  icon?: IoniconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View className={cn('items-center gap-2 px-6 py-10', className)} {...props}>
      <View className="mb-1 h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text variant="body" className="text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" color="muted" className="text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="outline" size="sm" onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}
