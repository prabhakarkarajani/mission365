import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, IconButton, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useJournalEntries } from '@/features/journal/application/journal.hooks';
import { getMoodMeta } from '@/features/journal/domain/moods';
import { formatDisplayDate } from '@/shared/lib/date';

export default function JournalListScreen() {
  const { data: entries, isLoading } = useJournalEntries();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader
        title="Journal"
        rightAction={
          <IconButton
            icon="add"
            size={32}
            iconSize={18}
            accessibilityLabel="New journal entry"
            onPress={() => router.push('/journal/new')}
          />
        }
      />
      <ScrollView contentContainerClassName="gap-3 px-6 pb-8">
        {isLoading ? (
          <Text color="muted">Loading...</Text>
        ) : !entries || entries.length === 0 ? (
          <Card className="items-center gap-2 py-10">
            <Ionicons name="book-outline" size={32} color={colors.muted} />
            <Text variant="body" color="muted" className="text-center">
              No journal entries yet.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/journal/new')}>
              <Text color="primary">Write your first entry</Text>
            </Pressable>
          </Card>
        ) : (
          entries.map((entry) => {
            const mood = getMoodMeta(entry.mood);
            return (
              <Card key={entry._id} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 20 }}>{mood.emoji}</Text>
                    <Text variant="bodySmall" color="muted">
                      {formatDisplayDate(entry.date)}
                    </Text>
                  </View>
                </View>
                <Text variant="body">{entry.content}</Text>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
