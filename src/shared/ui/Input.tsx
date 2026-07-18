import { type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from './cn';
import { colors } from '../theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  rightElement,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant="bodySmall" color="muted">
          {label}
        </Text>
      ) : null}
      <View className="relative justify-center">
        <TextInput
          placeholderTextColor={colors.muted}
          className={cn(
            'h-12 rounded-xl border border-border bg-surface px-4 font-poppins-regular text-[15px] text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark',
            rightElement && 'pr-11',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        {rightElement ? (
          <View className="absolute right-3">{rightElement}</View>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
