export type AttachmentAsset = {
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

type AttachmentPickResult = { canceled: true } | { asset: AttachmentAsset; canceled: false };

type AttachmentServiceDependencies = {
  exists: (uri: string) => boolean;
  pick: () => Promise<AttachmentPickResult>;
};

export type AttachmentSelectionResult =
  | { kind: 'canceled' }
  | { attachment: AttachmentPreview; kind: 'selected' }
  | { kind: 'unreadable' };

export function createAttachmentService({ exists, pick }: AttachmentServiceDependencies) {
  async function select(): Promise<AttachmentSelectionResult> {
    const result = await pick();

    if (result.canceled) {
      return { kind: 'canceled' };
    }

    if (!exists(result.asset.uri)) {
      return { kind: 'unreadable' };
    }

    return { attachment: toAttachmentPreview(result.asset), kind: 'selected' };
  }

  return { select };
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
