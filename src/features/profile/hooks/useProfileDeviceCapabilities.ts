import { useCallback, useEffect, useState } from 'react';

import { biometricUnlockPreference } from '@/features/auth/utils/biometricUnlockPreference';
import { unlockSavedSession } from '@/shared/device/biometrics/expoBiometricUnlockService';
import { getCurrentDeliveryArea } from '@/shared/device/location/expoDeliveryAreaService';

type DeviceNotice = { message: string; tone: 'error' | 'info' | 'success' };

export function useProfileDeviceCapabilities() {
  const [deliveryArea, setDeliveryArea] = useState<string | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoadingBiometric, setIsLoadingBiometric] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [needsLocationSettings, setNeedsLocationSettings] = useState(false);
  const [notice, setNotice] = useState<DeviceNotice | null>(null);

  useEffect(() => {
    void biometricUnlockPreference.isEnabled().then(setIsBiometricEnabled);
  }, []);

  const getDeliveryArea = useCallback(async () => {
    setIsLoadingLocation(true);
    setNeedsLocationSettings(false);

    try {
      const result = await getCurrentDeliveryArea();

      if (result.kind === 'resolved') {
        setDeliveryArea(result.area);
        setNotice({ message: '已更新当前配送区域。', tone: 'success' });
        return;
      }

      setNeedsLocationSettings(
        result.kind === 'permission-denied'
          ? result.needsSettings
          : result.kind === 'services-disabled',
      );
      setNotice({ message: result.message, tone: 'error' });
    } catch {
      setNotice({ message: '暂时无法获取配送区域，请稍后重试。', tone: 'error' });
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const setBiometricUnlockEnabled = useCallback(async (isEnabled: boolean) => {
    if (!isEnabled) {
      await biometricUnlockPreference.setEnabled(false);
      setIsBiometricEnabled(false);
      setNotice({ message: '已关闭重新打开 App 时的生物识别解锁。', tone: 'info' });
      return;
    }

    setIsLoadingBiometric(true);

    try {
      const result = await unlockSavedSession();

      if (result.kind !== 'unlocked' && result.kind !== 'mock-unlocked') {
        setNotice({ message: result.message, tone: 'error' });
        return;
      }

      await biometricUnlockPreference.setEnabled(true);
      setIsBiometricEnabled(true);
      setNotice({
        message:
          result.kind === 'mock-unlocked'
            ? '生物识别接口不可用，已使用本地 mock 解锁用于练习。'
            : '已启用重新打开 App 时的生物识别解锁。',
        tone: result.kind === 'mock-unlocked' ? 'info' : 'success',
      });
    } catch {
      setNotice({ message: '生物识别暂时不可用，请稍后重试。', tone: 'error' });
    } finally {
      setIsLoadingBiometric(false);
    }
  }, []);

  return {
    deliveryArea,
    getDeliveryArea,
    isBiometricEnabled,
    isLoadingBiometric,
    isLoadingLocation,
    needsLocationSettings,
    notice,
    setBiometricUnlockEnabled,
  };
}
