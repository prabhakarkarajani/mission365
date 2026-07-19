import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ModalHeader, Text, cn } from '@/shared/ui';
import { useCreateJournalEntry } from '@/features/journal/application/journal.hooks';
import { MOODS } from '@/features/journal/domain/moods';
import type { Mood } from '@/features/journal/domain/types';

export default function NewJournalEntryScreen() {
  const createEntry = useCreateJournalEntry();
  const [mood, setMood] = useState<Mood | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!mood) {
      setError('Pick how you’re feeling today.');
      return;
    }
    if (!content.trim()) {
      setError('Write a few words about your day.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createEntry.mutateAsync({ content: content.trim(), mood });
      router.back();
    } catch {
      setError('Could not save your entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader title="New Entry" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            How are you feeling today?
          </Text>
          <View className="flex-row justify-between">
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                accessibilityState={{ selected: mood === m.value }}
                onPress={() => setMood(m.value)}
                className={cn(
                  'h-14 w-14 items-center justify-center rounded-full border-2',
                  mood === m.value ? 'border-primary bg-primary/10' : 'border-transparent'
                )}
              >
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Your thoughts
          </Text>
          <TextInput
            multiline
            numberOfLines={8}
            placeholder="Write about your day, gratitude, or anything on your mind..."
            placeholderTextColor="#64748B"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
            className="min-h-[160px] rounded-input border border-border bg-surface p-4 font-inter-regular text-[16px] text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark"
          />
        </View>

        {error ? (
          <Text color="danger" variant="bodySmall">
            {error}
          </Text>
        ) : null}

        <Button label="Save Entry" variant="primary" size="lg" loading={submitting} onPress={onSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
