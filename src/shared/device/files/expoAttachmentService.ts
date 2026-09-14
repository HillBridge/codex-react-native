import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { createAttachmentService } from '@/shared/device/files/attachmentService';

const attachmentService = createAttachmentService({
  exists(uri) {
    return new File(uri).exists;
  },
  async pick() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });

    return result.canceled ? { canceled: true } : { asset: result.assets[0], canceled: false };
  },
});

export const selectOrderAttachment = attachmentService.select;
