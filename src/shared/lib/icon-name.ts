import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Narrows a dynamic string (e.g. from the API) to an Ionicons name. */
export function asIoniconName(value: string): IoniconName {
  return value as IoniconName;
}
