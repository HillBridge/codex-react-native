import * as Sharing from 'expo-sharing';

import { createSharingService } from '@/shared/device/sharing/sharingService';

const sharingService = createSharingService({
  isAvailable: Sharing.isAvailableAsync,
  share: (attachment) =>
    Sharing.shareAsync(attachment.uri, {
      dialogTitle: '分享订单附件',
      mimeType: attachment.mimeType === '未知类型' ? undefined : attachment.mimeType,
    }),
});

export const shareOrderAttachment = sharingService.share;
