import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './Text';
import { colors } from '../theme';

export interface TimePickerInputProps {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

function timeStringToDate(value?: string): Date {
  const date = new Date();
  if (value) {
    const [hours, minutes] = value.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(7, 0, 0, 0);
  }
  return date;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDisplayTime(value?: string): string | null {
  if (!value) return null;
  return timeStringToDate(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function TimePickerInput({ label, value, onChange, placeholder = 'Add a reminder time' }: TimePickerInputProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(dateToTimeString(selectedDate));
      }
      return;
    }
    if (selectedDate) {
      onChange(dateToTimeString(selectedDate));
    }
  };

  const displayValue = formatDisplayTime(value);

  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="bodySmall" color="muted">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setShow(true)}
        className="h-12 flex-row items-center justify-between rounded-xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="alarm-outline" size={18} color={colors.muted} />
          <Text variant="body" color={displayValue ? 'default' : 'muted'}>
            {displayValue ?? placeholder}
          </Text>
        </View>
        {displayValue ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear reminder time"
            hitSlop={8}
            onPress={() => onChange(undefined)}
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </Pressable>
      {show ? (
        <View className={Platform.OS === 'ios' ? 'items-end' : undefined}>
          <DateTimePicker
            value={timeStringToDate(value)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable accessibilityRole="button" onPress={() => setShow(false)} className="mt-1 px-3 py-1">
              <Text variant="bodySmall" color="primary">
                Done
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
