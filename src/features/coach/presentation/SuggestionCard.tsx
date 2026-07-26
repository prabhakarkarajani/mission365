import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';

import type { SuggestionCard as SuggestionCardType } from '../domain/coach.types';

export function SuggestionCard({ card, onPress }: { card: SuggestionCardType; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="w-36 gap-3 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={asIoniconName(card.icon)} size={18} color={colors.primary} />
      </View>
      <Text variant="bodySmall" numberOfLines={2}>
        {card.label}
      </Text>
    </Pressable>
  );
}
