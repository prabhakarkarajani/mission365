import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from './cn';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption';

export type TextColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'danger'
  | 'success'
  | 'accent'
  | 'warning'
  | 'inverse';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  display: 'font-inter-bold text-[32px] leading-[40px]',
  h1: 'font-inter-bold text-[24px] leading-[32px]',
  h2: 'font-inter-semibold text-[20px] leading-[28px]',
  h3: 'font-inter-semibold text-[18px] leading-[24px]',
  body: 'font-inter-regular text-[16px] leading-[24px]',
  bodySmall: 'font-inter-regular text-[14px] leading-[20px]',
  caption: 'font-inter-medium text-[12px] leading-[16px]',
};

const colorClasses: Record<TextColor, string> = {
  default: 'text-foreground dark:text-foreground-dark',
  muted: 'text-muted',
  primary: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
  accent: 'text-accent',
  warning: 'text-warning',
  inverse: 'text-white',
};

export function Text({
  variant = 'body',
  color = 'default',
  className,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(variantClasses[variant], colorClasses[color], className)}
      {...props}
    />
  );
}
