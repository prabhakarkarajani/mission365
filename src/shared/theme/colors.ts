/**
 * Mirrors the palette in tailwind.config.js — kept in sync manually.
 * Use this for contexts NativeWind classNames can't reach:
 * chart series colors, native StatusBar/icon props, SVG fills.
 */
export const colors = {
  primary: '#6366F1',
  danger: '#EF4444',
  success: '#10B981',
  accent: '#B85CF6',
  warning: '#F59E0B',
  secondary: '#F97316',
  muted: '#647468',
  background: {
    light: '#FFFFFF',
    dark: '#0D0B17',
  },
  surface: {
    light: '#F5F5F7',
    dark: '#1A1730',
  },
  border: {
    light: '#E5E7EB',
    dark: '#2A2740',
  },
  foreground: {
    light: '#111827',
    dark: '#F5F5F7',
  },
} as const;

export type ColorToken = keyof typeof colors;
