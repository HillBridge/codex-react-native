export type MediaPermission = {
  canAskAgain: boolean;
  granted: boolean;
};

export type MediaSource = 'camera' | 'library';

export type AvatarAsset = {
  height: number;
  uri: string;
  width: number;
};

type AvatarLaunchResult = { canceled: true } | { asset: AvatarAsset; canceled: false };

type AvatarServiceDependencies = {
  getPermissionMessage: (permission: MediaPermission, source: MediaSource) => string;
  launch: (source: MediaSource) => Promise<AvatarLaunchResult>;
  process: (asset: AvatarAsset) => Promise<string>;
  requestPermission: (source: MediaSource) => Promise<MediaPermission>;
};

export type AvatarSelectionResult =
  | { kind: 'canceled' }
  | { kind: 'permission-denied'; message: string; needsSettings: boolean }
  | { kind: 'selected'; uri: string };

export function createAvatarService({
  getPermissionMessage,
  launch,
  process,
  requestPermission,
}: AvatarServiceDependencies) {
  async function select(source: MediaSource): Promise<AvatarSelectionResult> {
    const permission = await requestPermission(source);

    if (!permission.granted) {
      return {
        kind: 'permission-denied',
        message: getPermissionMessage(permission, source),
        needsSettings: !permission.canAskAgain,
      };
    }

    const result = await launch(source);

    if (result.canceled) {
      return { kind: 'canceled' };
    }

    return { kind: 'selected', uri: await process(result.asset) };
  }

  return { select };
}
