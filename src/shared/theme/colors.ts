/**
 * Mirrors the palette in tailwind.config.js — kept in sync manually.
 * Use this for contexts NativeWind classNames can't reach:
 * chart series colors, native StatusBar/icon props, SVG fills.
 */
export const colors = {
  primary: '#4F46E5',
  danger: '#EF4444',
  success: '#10B981',
  accent: '#7C3AED',
  warning: '#F59E0B',
  secondary: '#10B981',
  muted: '#64748B',
  background: {
    light: '#F8FAFC',
    dark: '#0B0F1A',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#151A2E',
  },
  border: {
    light: '#E2E8F0',
    dark: '#232A45',
  },
  foreground: {
    light: '#0F172A',
    dark: '#F1F5F9',
  },
} as const;

export type ColorToken = keyof typeof colors;
