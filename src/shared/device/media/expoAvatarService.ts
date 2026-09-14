import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { createAvatarService } from '@/shared/device/media/avatarService';
import { createAvatarTransform } from '@/shared/device/media/avatarTransform';
import { getMediaPermissionMessage } from '@/shared/device/permissions/mediaPermission';

const avatarService = createAvatarService({
  getPermissionMessage: getMediaPermissionMessage,
  async launch(source) {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(IMAGE_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(IMAGE_OPTIONS);

    return result.canceled ? { canceled: true } : { asset: result.assets[0], canceled: false };
  },
  async process(asset) {
    const transform = createAvatarTransform(asset);

    if (!transform) {
      throw new Error('invalid-image-dimensions');
    }

    const context = ImageManipulator.manipulate(asset.uri);
    context.crop(transform.crop).resize(transform.resize);
    const renderedImage = await context.renderAsync();
    const result = await renderedImage.saveAsync({ compress: 0.78, format: SaveFormat.JPEG });

    return result.uri;
  },
  requestPermission(source) {
    return source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync()
      : ImagePicker.requestMediaLibraryPermissionsAsync();
  },
});

const IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: false,
  mediaTypes: ['images'],
  quality: 1,
};

export const selectAvatar = avatarService.select;
