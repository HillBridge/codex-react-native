import * as Linking from 'expo-linking';

export function openSystemSettings() {
  return Linking.openSettings();
}
