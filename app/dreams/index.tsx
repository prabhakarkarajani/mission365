import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Card, Chip, EmptyState, IconButton, Skeleton, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { useDreams } from '@/features/dreams/hooks/dream.hooks';
import type { Dream, DreamStatus } from '@/features/dreams/types/dream.types';

const TABS: { value: DreamStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export default function DreamsScreen() {
  const [status, setStatus] = useState<DreamStatus>('active');
  const { data: dreams, isLoading } = useDreams(status);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="gap-4 p-6">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Dreams</Text>
          <IconButton icon="add" accessibilityLabel="Add dream" onPress={() => router.push('/dreams/new')} />
        </View>
        <Text variant="bodySmall" color="muted">
          The destination behind your goals — who you&rsquo;re becoming, not just what you&rsquo;re doing.
        </Text>

        <View className="flex-row gap-2">
          {TABS.map((tab) => (
            <Chip
              key={tab.value}
              label={tab.label}
              selected={status === tab.value}
              onPress={() => setStatus(tab.value)}
            />
          ))}
        </View>

        {isLoading ? (
          <View className="gap-3 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark">
            <Skeleton style={{ height: 16, width: '70%' }} />
            <Skeleton style={{ height: 12, width: '90%' }} />
          </View>
        ) : !dreams || dreams.length === 0 ? (
          <Card>
            <EmptyState
              icon="sparkles-outline"
              title={`No ${status} dreams yet`}
              description={status === 'active' ? "What's the bigger picture your goals are building toward?" : undefined}
              actionLabel={status === 'active' ? 'Add your first dream' : undefined}
              onAction={status === 'active' ? () => router.push('/dreams/new') : undefined}
            />
          </Card>
        ) : (
          dreams.map((dream) => <DreamListCard key={dream._id} dream={dream} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DreamListCard({ dream }: { dream: Dream }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/dreams/${dream._id}`)}
      className="gap-2 rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark"
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${dream.color}1A` }}
        >
          <Ionicons name={asIoniconName(dream.icon)} size={20} color={dream.color} />
        </View>
        <View className="flex-1 gap-1">
          <Text variant="h3" numberOfLines={1}>
            {dream.title}
          </Text>
          {dream.description ? (
            <Text variant="bodySmall" color="muted" numberOfLines={2}>
              {dream.description}
            </Text>
          ) : null}
        </View>
        {dream.status === 'archived' ? <Badge label="Archived" color="muted" /> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}
