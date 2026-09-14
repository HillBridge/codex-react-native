import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAvatarTransform,
  getMediaPermissionMessage,
  getSharingUnavailableMessage,
  toAttachmentPreview,
} from '../../src/features/profile/media/profileMediaUtils.ts';

test('头像处理会从横图中央裁出正方形并压缩到统一尺寸', () => {
  const transform = createAvatarTransform({ height: 800, width: 1200 });

  assert.deepEqual(transform, {
    crop: { height: 800, originX: 200, originY: 0, width: 800 },
    resize: { height: 512, width: 512 },
  });
});

test('附件预览只保留文件元数据，不读取文件内容', () => {
  const preview = toAttachmentPreview({
    mimeType: 'application/pdf',
    name: 'order-receipt.pdf',
    size: 1_572_864,
    uri: 'file:///cache/order-receipt.pdf',
  });

  assert.deepEqual(preview, {
    displaySize: '1.5 MB',
    mimeType: 'application/pdf',
    name: 'order-receipt.pdf',
    uri: 'file:///cache/order-receipt.pdf',
  });
});

test('无法再次请求相机权限时，引导用户到系统设置而不是循环请求', () => {
  const message = getMediaPermissionMessage({ canAskAgain: false, granted: false }, 'camera');

  assert.equal(message, '相机权限已关闭，请在系统设置中开启后重试。');
});

test('系统不支持分享时显示本地提示', () => {
  assert.equal(getSharingUnavailableMessage(), '当前设备不支持系统分享。');
});
