import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

import { shouldInterceptAndroidBack } from './androidBackHandler';

export function useAndroidBusyBackHandler(isBusy: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () =>
      shouldInterceptAndroidBack({ isBusy, platform: Platform.OS }),
    );

    return () => subscription.remove();
  }, [isBusy]);
}
