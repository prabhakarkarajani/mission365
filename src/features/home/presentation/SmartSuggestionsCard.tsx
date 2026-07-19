import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useSmartSuggestions } from '../application/useSmartSuggestions';

export function SmartSuggestionsCard() {
  const { suggestion, applyTimeShift, isApplying } = useSmartSuggestions();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  if (!suggestion) return null;
  const key = `${suggestion.type}-${suggestion.habitId}`;
  if (key === dismissedKey) return null;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="bulb-outline" size={18} color={colors.warning} />
        <Text variant="h3">AI Noticed</Text>
      </View>
      <Text variant="body">{suggestion.message}</Text>
      <View className="flex-row gap-2">
        <Button
          label="Yes"
          size="sm"
          variant="primary"
          className="flex-1"
          loading={isApplying}
          onPress={() => {
            if (suggestion.type === 'time-shift') {
              applyTimeShift(suggestion);
            } else {
              router.push(`/habits/${suggestion.habitId}`);
            }
            setDismissedKey(key);
          }}
        />
        <Button
          label="Keep Current"
          size="sm"
          variant="outline"
          className="flex-1"
          onPress={() => setDismissedKey(key)}
        />
      </View>
    </Card>
  );
}
