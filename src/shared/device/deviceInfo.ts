import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { secureStorage } from '@/shared/storage';

const DEVICE_ID_KEY = 'device.id';

export const DEVICE_TYPE = {
  android: 2,
  ios: 1,
  other: 99,
  web: 3,
} as const;

function createDeviceId() {
  return `rn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getDeviceType() {
  if (Platform.OS === 'ios') {
    return DEVICE_TYPE.ios;
  }

  if (Platform.OS === 'android') {
    return DEVICE_TYPE.android;
  }

  if (Platform.OS === 'web') {
    return DEVICE_TYPE.web;
  }

  return DEVICE_TYPE.other;
}

export async function getDeviceId() {
  const savedDeviceId = await secureStorage.getString(DEVICE_ID_KEY);

  if (savedDeviceId) {
    return savedDeviceId;
  }

  const deviceId = createDeviceId();
  await secureStorage.setString(DEVICE_ID_KEY, deviceId);

  return deviceId;
}

export async function getDeviceInfo() {
  return {
    app_version: Constants.expoConfig?.version ?? '1.0.0',
    device_id: await getDeviceId(),
    device_token: '',
    device_type: getDeviceType(),
    os_version: `${Platform.OS} ${Platform.Version}`,
    push_enabled: false,
  };
}
