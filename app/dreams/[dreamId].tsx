import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Card, Input, ModalHeader, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { asIoniconName } from '@/shared/lib/icon-name';
import { useDeleteDream, useDreams, useUpdateDream } from '@/features/dreams/hooks/dream.hooks';
import { useGoals } from '@/features/goals/application/goal.hooks';

export default function DreamDetailScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const { data: dreams } = useDreams();
  const dream = dreams?.find((d) => d._id === dreamId);
  const { data: goals } = useGoals();
  const linkedGoals = goals?.filter((g) => g.dreamId === dreamId) ?? [];
  const updateDream = useUpdateDream();
  const deleteDream = useDeleteDream();

  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(dream?.title ?? '');
  const [descriptionDraft, setDescriptionDraft] = useState(dream?.description ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!dream) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Text color="muted">Dream not found.</Text>
      </SafeAreaView>
    );
  }

  const startEditing = () => {
    setTitleDraft(dream.title);
    setDescriptionDraft(dream.description);
    setIsEditing(true);
  };

  const onSave = async () => {
    if (!titleDraft.trim()) return;
    await updateDream.mutateAsync({
      dreamId: dream._id,
      input: { title: titleDraft.trim(), description: descriptionDraft.trim() },
    });
    setIsEditing(false);
  };

  const onToggleArchive = () => {
    updateDream.mutate({
      dreamId: dream._id,
      input: { status: dream.status === 'active' ? 'archived' : 'active' },
    });
  };

  const onDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteDream.mutateAsync(dream._id);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader
        title="Dream"
        rightAction={
          isEditing ? undefined : (
            <Pressable onPress={startEditing} hitSlop={8} accessibilityRole="button">
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          )
        }
      />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${dream.color}1A` }}
          >
            <Ionicons name={asIoniconName(dream.icon)} size={22} color={dream.color} />
          </View>
          {dream.status === 'archived' ? <Badge label="Archived" color="muted" /> : null}
        </View>

        {isEditing ? (
          <View className="gap-4">
            <Input label="Dream Title" value={titleDraft} onChangeText={setTitleDraft} />
            <Input
              label="Why does this matter?"
              value={descriptionDraft}
              onChangeText={setDescriptionDraft}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="h-28 py-3"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Cancel" variant="secondary" onPress={() => setIsEditing(false)} />
              </View>
              <View className="flex-1">
                <Button label="Save" variant="primary" loading={updateDream.isPending} onPress={onSave} />
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-2">
            <Text variant="h2">{dream.title}</Text>
            {dream.description ? (
              <Text variant="body" color="muted">
                {dream.description}
              </Text>
            ) : null}
          </View>
        )}

        {!isEditing && dream.status === 'active' ? (
          <Button
            label="Convert to Goal"
            variant="primary"
            onPress={() => router.push({ pathname: '/goals/new', params: { dreamId: dream._id } })}
          />
        ) : null}

        {linkedGoals.length > 0 ? (
          <View className="gap-2">
            <Text variant="bodySmall" color="muted">
              Goals under this Dream
            </Text>
            <Card className="gap-4">
              {linkedGoals.map((goal) => {
                const percent =
                  goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;
                return (
                  <View key={goal._id} className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text variant="body" numberOfLines={1} className="flex-1 pr-2">
                        {goal.title}
                      </Text>
                      <Text variant="caption" color="muted">
                        {Math.round(percent)}%
                      </Text>
                    </View>
                    <ProgressBar percent={percent} color={goal.color} />
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}

        <Card className="gap-3">
          <Button
            label={dream.status === 'active' ? 'Archive Dream' : 'Restore Dream'}
            variant="outline"
            onPress={onToggleArchive}
            loading={updateDream.isPending}
          />
          <Button
            label={confirmingDelete ? 'Tap again to confirm delete' : 'Delete Dream'}
            variant={confirmingDelete ? 'primary' : 'outline'}
            className={confirmingDelete ? 'bg-danger' : undefined}
            loading={deleteDream.isPending}
            onPress={onDelete}
          />
          {confirmingDelete ? (
            <Button label="Cancel" variant="ghost" onPress={() => setConfirmingDelete(false)} />
          ) : null}
        </Card>

        <Button label="Close" variant="secondary" size="lg" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
