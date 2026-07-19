import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, IconButton, Input, Text, cn } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useCoachChat } from '@/features/coach/hooks/useCoachChat';

interface SuggestedPrompt {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: 'send' | 'create-goal' | 'reschedule';
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { label: 'Plan My Day', icon: 'sunny-outline', action: 'send' },
  { label: 'Review Goals', icon: 'flag-outline', action: 'send' },
  { label: 'Weekly Review', icon: 'stats-chart-outline', action: 'send' },
  { label: 'Create Goal', icon: 'add-circle-outline', action: 'create-goal' },
  { label: 'Reschedule Mission', icon: 'time-outline', action: 'reschedule' },
  { label: 'Motivate Me', icon: 'flash-outline', action: 'send' },
];

export default function CoachScreen() {
  const { messages, sendMessage, isSending } = useCoachChat();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    sendMessage(trimmed);
    setDraft('');
    scrollToEnd();
  };

  const onPrompt = (prompt: SuggestedPrompt) => {
    if (prompt.action === 'create-goal') {
      router.push('/goal-builder/categories');
      return;
    }
    if (prompt.action === 'reschedule') {
      router.push('/habits');
      return;
    }
    submit(prompt.label);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="h2">AI Coach</Text>
            <Text variant="caption" color="muted">
              Grounded in your goals &amp; missions
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerClassName="gap-3 px-6 py-4"
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Card className="items-center gap-2 py-8">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="sparkles-outline" size={26} color={colors.primary} />
              </View>
              <Text variant="body" className="text-center">
                Hi, I&apos;m your AI Coach
              </Text>
              <Text variant="bodySmall" color="muted" className="text-center">
                Ask me to plan your day, review your goals, or pick a prompt below to get started.
              </Text>
            </Card>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} role={message.role} content={message.content} />)
          )}

          {isSending ? (
            <View className="max-w-[85%] self-start rounded-card rounded-bl-sm bg-surface px-4 py-3 dark:bg-surface-dark">
              <Text variant="bodySmall" color="muted">
                Thinking…
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-6 pb-3"
          keyboardShouldPersistTaps="handled"
        >
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt.label}
              accessibilityRole="button"
              onPress={() => onPrompt(prompt)}
              className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 dark:border-border-dark dark:bg-surface-dark"
            >
              <Ionicons name={prompt.icon} size={14} color={colors.primary} />
              <Text variant="caption">{prompt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row items-center gap-2 px-6 pb-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice input (coming soon)"
            className="h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-surface-dark"
            onPress={() => undefined}
            disabled
          >
            <Ionicons name="mic-outline" size={20} color={colors.muted} />
          </Pressable>
          <View className="flex-1">
            <Input
              placeholder="Ask me anything…"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => submit(draft)}
              returnKeyType="send"
            />
          </View>
          <IconButton
            icon="send"
            accessibilityLabel="Send message"
            onPress={() => submit(draft)}
            disabled={!draft.trim() || isSending}
            className={cn((!draft.trim() || isSending) && 'opacity-40')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <View
      className={cn(
        'max-w-[85%] rounded-card px-4 py-3',
        isUser ? 'self-end rounded-br-sm bg-primary' : 'self-start rounded-bl-sm bg-surface dark:bg-surface-dark'
      )}
    >
      <Text variant="body" color={isUser ? 'inverse' : 'default'}>
        {content}
      </Text>
    </View>
  );
}
