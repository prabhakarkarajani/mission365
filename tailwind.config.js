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
        primary: '#6366F1',
        danger: '#EF4444',
        success: '#10B981',
        accent: '#B85CF6',
        warning: '#F59E0B',
        secondary: '#F97316',
        muted: '#647468',
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#0D0B17',
        },
        surface: {
          DEFAULT: '#F5F5F7',
          dark: '#1A1730',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#2A2740',
        },
        foreground: {
          DEFAULT: '#111827',
          dark: '#F5F5F7',
        },
      },
      fontFamily: {
        'poppins-regular': ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};
