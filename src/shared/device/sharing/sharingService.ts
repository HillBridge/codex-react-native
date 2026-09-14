export type ShareableAttachment = {
  displaySize: string;
  mimeType: string;
  name: string;
  uri: string;
};

type SharingDependencies = {
  isAvailable: () => Promise<boolean>;
  share: (attachment: ShareableAttachment) => Promise<void>;
};

export type SharingResult = { kind: 'shared' } | { kind: 'unavailable'; message: string };

export function createSharingService({ isAvailable, share }: SharingDependencies) {
  async function shareAttachment(attachment: ShareableAttachment): Promise<SharingResult> {
    if (!(await isAvailable())) {
      return { kind: 'unavailable', message: getSharingUnavailableMessage() };
    }

    await share(attachment);
    return { kind: 'shared' };
  }

  return { share: shareAttachment };
}

export function getSharingUnavailableMessage() {
  return '当前设备不支持系统分享。';
}
