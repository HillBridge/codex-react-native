import assert from 'node:assert/strict';
import test from 'node:test';

import { createAttachmentService } from '../../src/shared/device/files/attachmentService.ts';
import { createAvatarService } from '../../src/shared/device/media/avatarService.ts';
import { getMediaPermissionMessage } from '../../src/shared/device/permissions/mediaPermission.ts';
import { createSharingService } from '../../src/shared/device/sharing/sharingService.ts';

test('头像权限被永久拒绝时不打开系统选择器，并要求前往设置', async () => {
  let launchCount = 0;
  const service = createAvatarService({
    getPermissionMessage: getMediaPermissionMessage,
    launch: async () => {
      launchCount += 1;
      return { canceled: true };
    },
    process: async () => 'file:///cache/avatar.jpg',
    requestPermission: async () => ({ canAskAgain: false, granted: false }),
  });

  const result = await service.select('camera');

  assert.deepEqual(result, {
    kind: 'permission-denied',
    message: '相机权限已关闭，请在系统设置中开启后重试。',
    needsSettings: true,
  });
  assert.equal(launchCount, 0);
});

test('头像服务会把选中的照片交给统一处理器并返回处理后的本地 URI', async () => {
  let receivedAsset: unknown;
  const service = createAvatarService({
    getPermissionMessage: getMediaPermissionMessage,
    launch: async () => ({
      asset: { height: 800, uri: 'file:///camera/original.jpg', width: 1200 },
      canceled: false,
    }),
    process: async (asset) => {
      receivedAsset = asset;
      return 'file:///cache/avatar-512.jpg';
    },
    requestPermission: async () => ({ canAskAgain: true, granted: true }),
  });

  const result = await service.select('library');

  assert.deepEqual(receivedAsset, {
    height: 800,
    uri: 'file:///camera/original.jpg',
    width: 1200,
  });
  assert.deepEqual(result, { kind: 'selected', uri: 'file:///cache/avatar-512.jpg' });
});

test('不可读取的附件不会作为可分享附件返回', async () => {
  const service = createAttachmentService({
    exists: () => false,
    pick: async () => ({
      asset: {
        mimeType: 'application/pdf',
        name: 'receipt.pdf',
        size: 1024,
        uri: 'file:///cache/receipt.pdf',
      },
      canceled: false,
    }),
  });

  assert.deepEqual(await service.select(), { kind: 'unreadable' });
});

test('不支持系统分享时不会调用分享操作', async () => {
  let shareCount = 0;
  const service = createSharingService({
    isAvailable: async () => false,
    share: async () => {
      shareCount += 1;
    },
  });

  const result = await service.share({
    displaySize: '1.0 KB',
    mimeType: 'application/pdf',
    name: 'receipt.pdf',
    uri: 'file:///cache/receipt.pdf',
  });

  assert.deepEqual(result, { kind: 'unavailable', message: '当前设备不支持系统分享。' });
  assert.equal(shareCount, 0);
});
