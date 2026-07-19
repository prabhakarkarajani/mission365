/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        danger: '#EF4444',
        success: '#10B981',
        accent: '#7C3AED',
        warning: '#F59E0B',
        secondary: '#10B981',
        muted: '#64748B',
        background: {
          DEFAULT: '#F8FAFC',
          dark: '#0B0F1A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#151A2E',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#232A45',
        },
        foreground: {
          DEFAULT: '#0F172A',
          dark: '#F1F5F9',
        },
      },
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        card: '24px',
        control: '16px',
        input: '12px',
      },
      boxShadow: {
        // Single-layer shadows — React Native only renders one shadow per
        // view natively, so a multi-layer CSS box-shadow would silently
        // collapse to just the first entry anyway.
        'elevation-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.08)',
        'elevation-md': '0 4px 10px -2px rgba(15, 23, 42, 0.12)',
        'elevation-lg': '0 12px 24px -6px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
