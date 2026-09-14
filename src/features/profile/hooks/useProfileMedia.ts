import { useCallback, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';

import {
  createAvatarTransform,
  getMediaPermissionMessage,
  getSharingUnavailableMessage,
  toAttachmentPreview,
  type AttachmentPreview,
} from '@/features/profile/media/profileMediaUtils';

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

  const showPermissionNotice = useCallback(
    (permission: { canAskAgain: boolean; granted: boolean }, source: 'camera' | 'library') => {
      if (permission.granted) {
        return false;
      }

      setNeedsSettings(!permission.canAskAgain);
      setNotice({
        message: getMediaPermissionMessage(permission, source),
        tone: 'error',
      });
      return true;
    },
    [],
  );

  const saveAvatar = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    const transform = createAvatarTransform(asset);

    if (!transform) {
      setNotice({ message: '无法读取照片尺寸，请换一张照片重试。', tone: 'error' });
      return;
    }

    setIsProcessingAvatar(true);
    setNeedsSettings(false);

    try {
      const context = ImageManipulator.manipulate(asset.uri);
      context.crop(transform.crop).resize(transform.resize);
      const renderedImage = await context.renderAsync();
      const result = await renderedImage.saveAsync({
        compress: 0.78,
        format: SaveFormat.JPEG,
      });

      setAvatarUri(result.uri);
      setNotice({ message: '头像已在本地更新，尚未上传到服务器。', tone: 'success' });
    } catch {
      setNotice({ message: '头像处理失败，请换一张照片重试。', tone: 'error' });
    } finally {
      setIsProcessingAvatar(false);
    }
  }, []);

  const pickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (showPermissionNotice(permission, 'library')) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled) {
      setNotice({ message: '已取消选择头像。', tone: 'info' });
      return;
    }

    await saveAvatar(result.assets[0]);
  }, [saveAvatar, showPermissionNotice]);

  const takeAvatarPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (showPermissionNotice(permission, 'camera')) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled) {
      setNotice({ message: '已取消拍摄头像。', tone: 'info' });
      return;
    }

    await saveAvatar(result.assets[0]);
  }, [saveAvatar, showPermissionNotice]);

  const pickOrderAttachment = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });

      if (result.canceled) {
        setNotice({ message: '已取消选择订单附件。', tone: 'info' });
        return;
      }

      const asset = result.assets[0];
      const file = new File(asset.uri);

      if (!file.exists) {
        setNotice({ message: '附件暂时无法读取，请重新选择。', tone: 'error' });
        return;
      }

      setAttachment(toAttachmentPreview(asset));
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
      if (!(await Sharing.isAvailableAsync())) {
        setNotice({ message: getSharingUnavailableMessage(), tone: 'info' });
        return;
      }

      await Sharing.shareAsync(attachment.uri, {
        dialogTitle: '分享订单附件',
        mimeType: attachment.mimeType === '未知类型' ? undefined : attachment.mimeType,
      });
      setNotice({ message: '已打开系统分享面板。', tone: 'success' });
    } catch {
      setNotice({ message: '无法分享该附件，请重新选择后再试。', tone: 'error' });
    }
  }, [attachment]);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
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
