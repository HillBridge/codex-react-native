import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { resolveNotificationRoute } from '@/shared/notifications/notificationRoute';

function navigateFromNotification(notification: Notifications.Notification) {
  const route = resolveNotificationRoute(notification.request.content.data);

  if (route) {
    router.push(route);
  }
}

export function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted && response?.notification) {
        navigateFromNotification(response.notification);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotification(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
