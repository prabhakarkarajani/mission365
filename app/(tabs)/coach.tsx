import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, IconButton, Input, Text, cn } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useCoachChat } from '@/features/coach/hooks/useCoachChat';
import { useCoachChatStore } from '@/features/coach/application/chat.store';
import { TypingDots } from '@/features/coach/presentation/TypingDots';

interface SuggestedPrompt {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: 'send' | 'reschedule' | 'weekly-review';
  prompt?: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { label: 'Plan My Day', icon: 'sunny-outline', action: 'send' },
  { label: 'Review Goals', icon: 'flag-outline', action: 'send' },
  { label: 'Generate Roadmap', icon: 'map-outline', action: 'send', prompt: 'Generate a roadmap for my current goal.' },
  { label: 'Weekly Review', icon: 'stats-chart-outline', action: 'weekly-review' },
  { label: 'Motivate Me', icon: 'flash-outline', action: 'send' },
  { label: 'Reschedule Mission', icon: 'time-outline', action: 'reschedule' },
];

export default function CoachScreen() {
  const user = useAuthStore((s) => s.user);
  const { messages, sendMessage, isSending } = useCoachChat();
  const clearChat = useCoachChatStore((s) => s.clear);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const firstName = user?.name?.split(' ')[0] ?? '';
  const userInitial = firstName ? firstName[0]?.toUpperCase() : '🙂';

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    sendMessage(trimmed);
    setDraft('');
    scrollToEnd();
  };

  const onPrompt = (prompt: SuggestedPrompt) => {
    if (prompt.action === 'reschedule') {
      router.push('/habits');
      return;
    }
    if (prompt.action === 'weekly-review') {
      router.push('/weekly-review');
      return;
    }
    submit(prompt.prompt ?? prompt.label);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="h2">Maya</Text>
            <Text variant="caption" color="muted">
              Your AI Coach · grounded in your goals &amp; missions
            </Text>
          </View>
          {messages.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear conversation"
              onPress={clearChat}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
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
                Hi, I&apos;m Maya, your AI Coach
              </Text>
              <Text variant="bodySmall" color="muted" className="text-center">
                Ask me to plan your day, review your goals, or pick a prompt below to get started.
              </Text>
            </Card>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} role={message.role} content={message.content} userInitial={userInitial} />
            ))
          )}

          {isSending ? (
            <View className="max-w-[85%] flex-row items-end gap-2 self-start">
              <Avatar role="assistant" initial={userInitial} />
              <TypingDots />
            </View>
          ) : null}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-none"
          contentContainerClassName="items-center gap-2 px-6 pb-3"
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

function Avatar({ role, initial }: { role: 'user' | 'assistant'; initial: string }) {
  if (role === 'assistant') {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name="sparkles" size={13} color={colors.primary} />
      </View>
    );
  }
  return (
    <View className="h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
      <Text variant="caption">{initial}</Text>
    </View>
  );
}

function ChatBubble({
  role,
  content,
  userInitial,
}: {
  role: 'user' | 'assistant';
  content: string;
  userInitial: string;
}) {
  const isUser = role === 'user';
  return (
    <View className={cn('max-w-[85%] flex-row items-end gap-2', isUser ? 'self-end flex-row-reverse' : 'self-start')}>
      <Avatar role={role} initial={userInitial} />
      <View
        className={cn(
          'min-w-0 shrink rounded-card px-4 py-3',
          isUser ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-surface dark:bg-surface-dark'
        )}
      >
        <Text variant="body" color={isUser ? 'inverse' : 'default'} className="flex-shrink">
          {content}
        </Text>
      </View>
    </View>
  );
}
