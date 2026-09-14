export type MediaPermission = {
  canAskAgain: boolean;
  granted: boolean;
};

export type MediaSource = 'camera' | 'library';

export function getMediaPermissionMessage(permission: MediaPermission, source: MediaSource) {
  if (permission.granted) {
    return '';
  }

  const label = source === 'camera' ? '相机' : '照片库';

  return permission.canAskAgain
    ? `未获得${label}权限，你可以稍后再次尝试。`
    : `${label}权限已关闭，请在系统设置中开启后重试。`;
}
