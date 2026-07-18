import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cn } from './cn';
import { colors } from '../theme';
import { Text, type TextVariant } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const containerVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-black/5 dark:bg-white/10',
  outline: 'bg-transparent border border-border dark:border-border-dark',
  ghost: 'bg-transparent',
};

const labelColorByVariant: Record<ButtonVariant, 'inverse' | 'default'> = {
  primary: 'inverse',
  secondary: 'default',
  outline: 'default',
  ghost: 'default',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 rounded-lg',
  md: 'h-12 px-5 rounded-xl',
  lg: 'h-14 px-6 rounded-2xl',
};

const labelSizeClasses: Record<ButtonSize, TextVariant> = {
  sm: 'bodySmall',
  md: 'body',
  lg: 'h3',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        containerVariantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <Text variant={labelSizeClasses[size]} color={labelColorByVariant[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
