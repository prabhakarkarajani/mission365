import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './Text';
import { colors } from '../theme';
import { formatDisplayDate, toDateKey } from '../lib/date';

export interface DatePickerInputProps {
  label?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
}

function dateKeyToDate(value?: string | null): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  minimumDate,
}: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(toDateKey(selectedDate));
      }
      return;
    }
    if (selectedDate) {
      onChange(toDateKey(selectedDate));
    }
  };

  const displayValue = value ? formatDisplayDate(value) : null;

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
          <Ionicons name="calendar-outline" size={18} color={colors.muted} />
          <Text variant="body" color={displayValue ? 'default' : 'muted'} numberOfLines={1}>
            {displayValue ?? placeholder}
          </Text>
        </View>
        {displayValue ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear date"
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
            value={dateKeyToDate(value)}
            mode="date"
            minimumDate={minimumDate}
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
