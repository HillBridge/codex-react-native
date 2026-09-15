export type BiometricUnlockResult =
  | { kind: 'unlocked' }
  | { kind: 'mock-unlocked' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'not-enrolled'; message: string }
  | { kind: 'rejected'; message: string };

type BiometricDependencies = {
  authenticate: () => Promise<{ success: boolean }>;
  hasHardware: () => Promise<boolean>;
  isEnrolled: () => Promise<boolean>;
};

export function createBiometricUnlockService({
  authenticate,
  hasHardware,
  isEnrolled,
}: BiometricDependencies) {
  return {
    async unlock(): Promise<BiometricUnlockResult> {
      try {
        if (!(await hasHardware())) {
          return { kind: 'unavailable', message: '此设备不支持生物识别解锁。' };
        }

        if (!(await isEnrolled())) {
          return { kind: 'not-enrolled', message: '设备尚未录入生物识别信息。' };
        }

        return (await authenticate()).success
          ? { kind: 'unlocked' }
          : { kind: 'rejected', message: '生物识别未通过，请重试或使用账号登录。' };
      } catch {
        return { kind: 'rejected', message: '生物识别暂时不可用，请重试或使用账号登录。' };
      }
    },
  };
}

export async function resolveSessionUnlock({
  isEnabled,
  unlock,
}: {
  isEnabled: () => Promise<boolean>;
  unlock: () => Promise<BiometricUnlockResult>;
}): Promise<BiometricUnlockResult | { kind: 'not-required' }> {
  return (await isEnabled()) ? unlock() : { kind: 'not-required' };
}

export async function resolveBiometricUnlock({
  unlock,
  useMockFallback,
}: {
  unlock: () => Promise<BiometricUnlockResult>;
  useMockFallback: boolean;
}): Promise<BiometricUnlockResult> {
  const result = await unlock();

  return result.kind === 'unlocked' || !useMockFallback ? result : { kind: 'mock-unlocked' };
}
