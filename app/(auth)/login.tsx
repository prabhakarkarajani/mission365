import { useState } from 'react';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { Button, Input, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { ApiClientError } from '@/shared/lib/api-client';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.replace('/home');
    } catch (error) {
      setServerError(
        error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="flex-1 justify-center gap-6 px-8" keyboardShouldPersistTaps="handled">
        <View className="items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-card bg-primary/10">
            <Ionicons name="rocket-outline" size={30} color={colors.primary} />
          </View>
          <View className="items-center gap-1">
            <Text variant="h1">Welcome back</Text>
            <Text variant="body" color="muted">
              Login to continue your journey
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!passwordVisible}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
                rightElement={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    onPress={() => setPasswordVisible((v) => !v)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.muted}
                    />
                  </Pressable>
                }
              />
            )}
          />
        </View>

        {serverError ? (
          <View className="flex-row items-center gap-2 rounded-input bg-danger/10 px-4 py-3">
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text color="danger" variant="bodySmall" className="flex-1">
              {serverError}
            </Text>
          </View>
        ) : null}

        <Button label="Login" variant="primary" size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />

        <Pressable
          accessibilityRole="button"
          className="flex-row justify-center gap-1"
          onPress={() => router.push('/signup')}
        >
          <Text color="muted">Don&apos;t have an account?</Text>
          <Text color="primary">Sign Up</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
