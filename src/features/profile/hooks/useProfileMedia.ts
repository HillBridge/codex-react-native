import { useCallback, useState } from 'react';

import { selectOrderAttachment } from '@/shared/device/files/expoAttachmentService';
import type { AttachmentPreview } from '@/shared/device/files/attachmentService';
import { selectAvatar } from '@/shared/device/media/expoAvatarService';
import { openSystemSettings as openNativeSystemSettings } from '@/shared/device/permissions/systemSettings';
import { shareOrderAttachment } from '@/shared/device/sharing/expoSharingService';

type NoticeTone = 'error' | 'info' | 'success';

type MediaNotice = {
  message: string;
  tone: NoticeTone;
};

export function useProfileMedia() {
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [needsSettings, setNeedsSettings] = useState(false);
  const [notice, setNotice] = useState<MediaNotice | null>(null);

  const selectProfileAvatar = useCallback(async (source: 'camera' | 'library') => {
    setIsProcessingAvatar(true);
    setNeedsSettings(false);

    try {
      const result = await selectAvatar(source);

      if (result.kind === 'permission-denied') {
        setNeedsSettings(result.needsSettings);
        setNotice({ message: result.message, tone: 'error' });
        return;
      }

      if (result.kind === 'canceled') {
        setNotice({
          message: source === 'camera' ? '已取消拍摄头像。' : '已取消选择头像。',
          tone: 'info',
        });
        return;
      }

      setAvatarUri(result.uri);
      setNotice({ message: '头像已在本地更新，尚未上传到服务器。', tone: 'success' });
    } catch {
      setNotice({ message: '头像处理失败，请换一张照片重试。', tone: 'error' });
    } finally {
      setIsProcessingAvatar(false);
    }
  }, []);

  const pickAvatar = useCallback(() => selectProfileAvatar('library'), [selectProfileAvatar]);

  const takeAvatarPhoto = useCallback(() => selectProfileAvatar('camera'), [selectProfileAvatar]);

  const pickOrderAttachment = useCallback(async () => {
    try {
      const result = await selectOrderAttachment();

      if (result.kind === 'canceled') {
        setNotice({ message: '已取消选择订单附件。', tone: 'info' });
        return;
      }

      if (result.kind === 'unreadable') {
        setNotice({ message: '附件暂时无法读取，请重新选择。', tone: 'error' });
        return;
      }

      setAttachment(result.attachment);
      setNeedsSettings(false);
      setNotice({ message: '附件已选择，仅保留本地元数据。', tone: 'success' });
    } catch {
      setNotice({ message: '选择附件失败，请稍后重试。', tone: 'error' });
    }
  }, []);

  const shareAttachment = useCallback(async () => {
    if (!attachment) {
      return;
    }

    try {
      const result = await shareOrderAttachment(attachment);

      if (result.kind === 'unavailable') {
        setNotice({ message: result.message, tone: 'info' });
        return;
      }

      setNotice({ message: '已打开系统分享面板。', tone: 'success' });
    } catch {
      setNotice({ message: '无法分享该附件，请重新选择后再试。', tone: 'error' });
    }
  }, [attachment]);

  const openSystemSettings = useCallback(() => {
    openNativeSystemSettings().catch(() => {
      setNotice({ message: '无法打开系统设置，请手动前往设置页。', tone: 'error' });
    });
  }, []);

  return {
    attachment,
    avatarUri,
    isProcessingAvatar,
    needsSettings,
    notice,
    openSystemSettings,
    pickAvatar,
    pickOrderAttachment,
    shareAttachment,
    takeAvatarPhoto,
  };
}
