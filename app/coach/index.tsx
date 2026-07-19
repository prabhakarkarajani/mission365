import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Badge, Button, Card, Input, ModalHeader, Text } from '@/shared/ui';
import { useGenerateRoadmap } from '@/features/coach/hooks/useGenerateRoadmap';

export default function CoachScreen() {
  const [goalTitle, setGoalTitle] = useState('');
  const generateRoadmap = useGenerateRoadmap();

  const onGenerate = () => {
    if (!goalTitle.trim()) return;
    generateRoadmap.mutate({ goalTitle: goalTitle.trim() });
  };

  const roadmap = generateRoadmap.data;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="AI Coach" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            What do you want to achieve?
          </Text>
          <Input
            placeholder="e.g. Run a half marathon"
            value={goalTitle}
            onChangeText={setGoalTitle}
            returnKeyType="done"
            onSubmitEditing={onGenerate}
          />
        </View>

        <Button
          label="Generate Roadmap"
          variant="primary"
          size="lg"
          loading={generateRoadmap.isPending}
          disabled={!goalTitle.trim()}
          onPress={onGenerate}
        />

        {generateRoadmap.isError ? (
          <Text color="danger" variant="bodySmall">
            Could not generate a roadmap. Please try again.
          </Text>
        ) : null}

        {roadmap ? (
          <View className="gap-5">
            <Card className="gap-2">
              <Text variant="bodySmall" color="muted">
                Summary
              </Text>
              <Text variant="body">{roadmap.summary}</Text>
            </Card>

            <View className="gap-2">
              <Text variant="bodySmall" color="muted">
                Milestones
              </Text>
              <Card className="gap-4">
                {roadmap.milestones.map((milestone) => (
                  <View key={milestone.title} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text variant="body">{milestone.title}</Text>
                      <Badge label={`Day ${milestone.targetOffsetDays}`} color="muted" />
                    </View>
                    {milestone.description ? (
                      <Text variant="bodySmall" color="muted">
                        {milestone.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>

            <View className="gap-2">
              <Text variant="bodySmall" color="muted">
                Suggested Missions
              </Text>
              <Card className="gap-4">
                {roadmap.suggestedMissions.map((mission) => (
                  <View key={mission.title} className="gap-1">
                    <Text variant="body">{mission.title}</Text>
                    <View className="flex-row gap-2">
                      <Badge label={mission.type} color="primary" />
                      <Badge label={mission.priority} color="accent" />
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
