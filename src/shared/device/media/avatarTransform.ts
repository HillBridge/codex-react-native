export const AVATAR_SIZE = 512;

export type AvatarAsset = {
  height: number;
  uri: string;
  width: number;
};

export function createAvatarTransform({ height, width }: AvatarAsset) {
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
