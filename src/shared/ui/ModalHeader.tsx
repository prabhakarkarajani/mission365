import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { Text } from './Text';
import { colors } from '../theme';

export interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  rightAction?: ReactNode;
}

export function ModalHeader({ title, onClose, rightAction }: ModalHeaderProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.foreground.dark : colors.foreground.light;

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onClose ?? (() => router.back())}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={24} color={iconColor} />
      </Pressable>
      <Text variant="h3">{title}</Text>
      <View style={{ minWidth: 24, alignItems: 'flex-end' }}>{rightAction}</View>
    </View>
  );
}
