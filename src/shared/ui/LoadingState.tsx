import { ActivityIndicator, View, type ViewProps } from 'react-native';

import { cn } from './cn';
import { colors } from '../theme';
import { Text } from './Text';

export interface LoadingStateProps extends ViewProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading...', className, ...props }: LoadingStateProps) {
  return (
    <View className={cn('items-center justify-center gap-3 py-12', className)} {...props}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <Text variant="bodySmall" color="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
