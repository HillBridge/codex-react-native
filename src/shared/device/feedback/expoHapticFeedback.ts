import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { createHapticFeedbackService } from './hapticFeedbackService';

function success() {
  return Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

function error() {
  return Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

function selection() {
  return Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick)
    : Haptics.selectionAsync();
}

export const hapticFeedback = createHapticFeedbackService({ error, selection, success });

export function triggerHapticFeedback(kind: 'error' | 'selection' | 'success') {
  return hapticFeedback.trigger(kind);
}
