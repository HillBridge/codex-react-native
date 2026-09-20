import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PRODUCT_REMINDER_CHANNEL = 'product-reminders';

export type ProductReminderResult = 'denied' | 'scheduled' | 'unavailable';

async function hasNotificationPermission() {
  const status = await Notifications.getPermissionsAsync();

  if (status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  return (
    requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function scheduleProductReminder(slug: string): Promise<ProductReminderResult> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(PRODUCT_REMINDER_CHANNEL, {
        importance: Notifications.AndroidImportance.DEFAULT,
        name: '商品提醒',
      });
    }

    if (!(await hasNotificationPermission())) {
      return 'denied';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        body: '点按通知，打开本次练习指定的商品详情。',
        data: { url: `rnmall://products/${slug}` },
        title: '商品提醒练习',
      },
      trigger: null,
    });

    return 'scheduled';
  } catch {
    return 'unavailable';
  }
}
