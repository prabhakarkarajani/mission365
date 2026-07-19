import { View, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from './cn';
import { colors } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export interface ErrorStateProps extends ViewProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <View className={cn('items-center gap-2 px-6 py-10', className)} {...props}>
      <View className="mb-1 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text variant="body" className="text-center">
        {title}
      </Text>
      <Text variant="bodySmall" color="muted" className="text-center">
        {description}
      </Text>
      {onRetry ? <Button label="Retry" variant="outline" size="sm" onPress={onRetry} className="mt-2" /> : null}
    </View>
  );
}
