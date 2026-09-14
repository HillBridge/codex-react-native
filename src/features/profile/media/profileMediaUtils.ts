export const AVATAR_SIZE = 512;

type ImageDimensions = {
  height: number;
  width: number;
};

type PermissionResponse = {
  canAskAgain: boolean;
  granted: boolean;
};

type MediaSource = 'camera' | 'library';

type AttachmentAsset = {
  mimeType?: string;
  name: string;
  size?: number;
  uri: string;
};

export type AttachmentPreview = {
  displaySize: string;
  mimeType: string;
  name: string;
  uri: string;
};

export function createAvatarTransform({ height, width }: ImageDimensions) {
  const side = Math.min(height, width);

  if (side <= 0) {
    return null;
  }

  return {
    crop: {
      height: side,
      originX: Math.floor((width - side) / 2),
      originY: Math.floor((height - side) / 2),
      width: side,
    },
    resize: { height: AVATAR_SIZE, width: AVATAR_SIZE },
  };
}

export function toAttachmentPreview({
  mimeType,
  name,
  size,
  uri,
}: AttachmentAsset): AttachmentPreview {
  return {
    displaySize: formatFileSize(size),
    mimeType: mimeType || '未知类型',
    name,
    uri,
  };
}

export function getMediaPermissionMessage(permission: PermissionResponse, source: MediaSource) {
  if (permission.granted) {
    return '';
  }

  const label = source === 'camera' ? '相机' : '照片库';

  return permission.canAskAgain
    ? `未获得${label}权限，你可以稍后再次尝试。`
    : `${label}权限已关闭，请在系统设置中开启后重试。`;
}

export function getSharingUnavailableMessage() {
  return '当前设备不支持系统分享。';
}

function formatFileSize(size: number | undefined) {
  if (!size || size < 0) {
    return '大小未知';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
