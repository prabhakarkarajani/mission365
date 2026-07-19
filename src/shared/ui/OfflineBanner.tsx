import { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View
      pointerEvents="none"
      className="flex-row items-center justify-center gap-2 bg-warning/90"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingBottom: 6, zIndex: 50 }}
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
      <Text variant="caption" color="inverse">
        You&apos;re offline — changes will sync once you&apos;re back online
      </Text>
    </View>
  );
}
