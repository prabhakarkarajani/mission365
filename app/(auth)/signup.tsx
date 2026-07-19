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

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const register = useAuthStore((s) => s.register);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignupForm) => {
    setServerError(null);
    try {
      await register(values.fullName, values.email, values.password);
      router.replace('/(onboarding)/tour');
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
            <Ionicons name="sparkles-outline" size={30} color={colors.primary} />
          </View>
          <View className="items-center gap-1">
            <Text variant="h1">Create your account</Text>
            <Text variant="body" color="muted">
              Start your transformation today
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.fullName?.message}
              />
            )}
          />
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
                placeholder="Create a password"
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

        <Button
          label="Sign Up"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <Pressable
          accessibilityRole="button"
          className="flex-row justify-center gap-1"
          onPress={() => router.push('/login')}
        >
          <Text color="muted">Already have an account?</Text>
          <Text color="primary">Login</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
