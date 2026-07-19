import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { cn } from './cn';

export interface FloatingAIButtonProps {
  bottom?: number;
  className?: string;
}

export function FloatingAIButton({ bottom = 88, className }: FloatingAIButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open AI Coach"
      onPress={() => router.push('/coach')}
      className={cn(
        'absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-elevation-lg',
        className
      )}
      style={{ bottom }}
    >
      <Ionicons name="sparkles" size={24} color="#FFFFFF" />
    </Pressable>
  );
}
