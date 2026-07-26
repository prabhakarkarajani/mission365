import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/shared/ui';
import { MOODS } from '@/features/journal/domain/moods';
import type { Mood } from '@/features/journal/domain/types';

export function MoodCheckInSheet({
  visible,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  onSelect: (mood: Mood) => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onDismiss}>
        <Pressable className="gap-4 rounded-t-3xl bg-surface p-6 dark:bg-surface-dark" onPress={() => undefined}>
          <Text variant="h3" className="text-center">
            How are you feeling?
          </Text>
          <View className="flex-row justify-between">
            {MOODS.map((mood) => (
              <Pressable
                key={mood.value}
                accessibilityRole="button"
                accessibilityLabel={mood.label}
                onPress={() => onSelect(mood.value)}
                className="items-center gap-1 px-2 py-2"
              >
                <Text className="text-3xl">{mood.emoji}</Text>
                <Text variant="caption" color="muted">
                  {mood.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
