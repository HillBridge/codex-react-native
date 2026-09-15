import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createBiometricUnlockService,
  resolveBiometricUnlock,
  resolveSessionUnlock,
} from '../../src/shared/device/biometrics/biometricUnlockService.ts';
import { createDeliveryAreaService } from '../../src/shared/device/location/deliveryAreaService.ts';
import { shouldInterceptAndroidBack } from '../../src/shared/device/platform/androidBackHandler.ts';
import { createHapticFeedbackService } from '../../src/shared/device/feedback/hapticFeedbackService.ts';

test('定位权限被永久拒绝时，引导用户前往系统设置而不是继续定位', async () => {
  const service = createDeliveryAreaService({
    areServicesEnabled: async () => true,
    requestPermission: async () => ({ canAskAgain: false, granted: false }),
    resolveArea: async () => '上海市 黄浦区',
  });

  assert.deepEqual(await service.getCurrentDeliveryArea(), {
    kind: 'permission-denied',
    message: '定位权限已关闭，请在系统设置中开启后重试。',
    needsSettings: true,
  });
});

test('定位服务关闭时，不会继续请求配送区域', async () => {
  let resolved = false;
  const service = createDeliveryAreaService({
    areServicesEnabled: async () => false,
    requestPermission: async () => ({ canAskAgain: true, granted: true }),
    resolveArea: async () => {
      resolved = true;
      return '上海市 黄浦区';
    },
  });

  assert.deepEqual(await service.getCurrentDeliveryArea(), {
    kind: 'services-disabled',
    message: '系统定位服务未开启，请开启后重试。',
  });
  assert.equal(resolved, false);
});

test('无法解析当前位置时，配送区域显示可理解的不可用状态', async () => {
  const service = createDeliveryAreaService({
    areServicesEnabled: async () => true,
    requestPermission: async () => ({ canAskAgain: true, granted: true }),
    resolveArea: async () => null,
  });

  assert.deepEqual(await service.getCurrentDeliveryArea(), {
    kind: 'unavailable',
    message: '暂时无法获取配送区域，请稍后重试。',
  });
});

test('成功定位时只返回配送区域文案，不暴露精确经纬度', async () => {
  const service = createDeliveryAreaService({
    areServicesEnabled: async () => true,
    requestPermission: async () => ({ canAskAgain: true, granted: true }),
    resolveArea: async () => '上海市 黄浦区',
  });

  assert.deepEqual(await service.getCurrentDeliveryArea(), {
    area: '上海市 黄浦区',
    kind: 'resolved',
  });
});

test('未启用生物识别时，会直接继续恢复会话', async () => {
  const result = await resolveSessionUnlock({
    isEnabled: async () => false,
    unlock: async () => {
      throw new Error('不应调用生物识别');
    },
  });

  assert.deepEqual(result, { kind: 'not-required' });
});

test('生物识别硬件不可用时，提供明确的降级结果', async () => {
  const service = createBiometricUnlockService({
    authenticate: async () => ({ success: true }),
    hasHardware: async () => false,
    isEnrolled: async () => true,
  });

  assert.deepEqual(await service.unlock(), {
    kind: 'unavailable',
    message: '此设备不支持生物识别解锁。',
  });
});

test('生物识别验证成功时，允许恢复已保存会话', async () => {
  const service = createBiometricUnlockService({
    authenticate: async () => ({ success: true }),
    hasHardware: async () => true,
    isEnrolled: async () => true,
  });

  assert.deepEqual(await service.unlock(), { kind: 'unlocked' });
});

test('生物识别底层调用异常时，返回可降级的失败结果而不是中断启动流程', async () => {
  const service = createBiometricUnlockService({
    authenticate: async () => {
      throw new Error('native service unavailable');
    },
    hasHardware: async () => true,
    isEnrolled: async () => true,
  });

  assert.deepEqual(await service.unlock(), {
    kind: 'rejected',
    message: '生物识别暂时不可用，请重试或使用账号登录。',
  });
});

test('仅在显式开启开发 mock 时，生物识别失败才允许用本地模拟结果继续', async () => {
  const rejected = async () => ({
    kind: 'unavailable' as const,
    message: '此设备不支持生物识别解锁。',
  });

  assert.deepEqual(await resolveBiometricUnlock({ unlock: rejected, useMockFallback: false }), {
    kind: 'unavailable',
    message: '此设备不支持生物识别解锁。',
  });
  assert.deepEqual(await resolveBiometricUnlock({ unlock: rejected, useMockFallback: true }), {
    kind: 'mock-unlocked',
  });
});

test('成功、错误和选择操作使用三种不同的触感反馈', async () => {
  const effects: string[] = [];
  const service = createHapticFeedbackService({
    error: async () => effects.push('error'),
    selection: async () => effects.push('selection'),
    success: async () => effects.push('success'),
  });

  await service.trigger('success');
  await service.trigger('error');
  await service.trigger('selection');

  assert.deepEqual(effects, ['success', 'error', 'selection']);
});

test('Android 正在执行设备操作时拦截硬件返回，其他平台保持默认返回', () => {
  assert.equal(shouldInterceptAndroidBack({ isBusy: true, platform: 'android' }), true);
  assert.equal(shouldInterceptAndroidBack({ isBusy: false, platform: 'android' }), false);
  assert.equal(shouldInterceptAndroidBack({ isBusy: true, platform: 'ios' }), false);
});
