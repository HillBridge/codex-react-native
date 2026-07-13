import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthBootstrapper, useConfigureAuthApiClient } from '@/features/auth';
import { colors } from '@/shared/constants/theme';

export default function RootLayout() {
  useConfigureAuthApiClient();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthBootstrapper>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShown: false,
            }}
          />
        </AuthBootstrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
