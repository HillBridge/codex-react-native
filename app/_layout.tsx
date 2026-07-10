import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useConfigureApiClient } from '@/api/useConfigureApiClient';
import { colors } from '@/shared/constants/theme';

export default function RootLayout() {
  useConfigureApiClient();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
