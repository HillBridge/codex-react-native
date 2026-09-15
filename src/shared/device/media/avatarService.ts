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

export type AvatarTiming = {
  durationMs: number;
  source: MediaSource;
  step: 'permission' | 'open-system-ui' | 'selection-returned' | 'image-processing';
};

type AvatarLaunchResult = { canceled: true } | { asset: AvatarAsset; canceled: false };

type AvatarServiceDependencies = {
  beginNativeSystemUiActivity?: () => () => void;
  getPermissionMessage: (permission: MediaPermission, source: MediaSource) => string;
  launch: (source: MediaSource) => Promise<AvatarLaunchResult>;
  now?: () => number;
  process: (asset: AvatarAsset) => Promise<string>;
  reportTiming?: (timing: AvatarTiming) => void;
  requestPermission: (source: MediaSource) => Promise<MediaPermission>;
};

export type AvatarSelectionResult =
  | { kind: 'canceled' }
  | { kind: 'permission-denied'; message: string; needsSettings: boolean }
  | { kind: 'selected'; uri: string };

export function createAvatarService({
  beginNativeSystemUiActivity,
  getPermissionMessage,
  launch,
  now = Date.now,
  process,
  reportTiming = () => undefined,
  requestPermission,
}: AvatarServiceDependencies) {
  async function select(source: MediaSource): Promise<AvatarSelectionResult> {
    const permissionStartedAt = now();
    const permission = await requestPermission(source);
    reportTiming({ durationMs: now() - permissionStartedAt, source, step: 'permission' });

    if (!permission.granted) {
      return {
        kind: 'permission-denied',
        message: getPermissionMessage(permission, source),
        needsSettings: !permission.canAskAgain,
      };
    }

    const endNativeSystemUiActivity = beginNativeSystemUiActivity?.();
    let result: AvatarLaunchResult;

    try {
      const systemUiStartedAt = now();
      const launchResult = launch(source);

      // Expo's picker API resolves only after the user selects or cancels. This measures
      // dispatching the native UI separately from waiting for its selected asset result.
      reportTiming({ durationMs: now() - systemUiStartedAt, source, step: 'open-system-ui' });

      const selectionReturnedAt = now();
      result = await launchResult;
      reportTiming({
        durationMs: now() - selectionReturnedAt,
        source,
        step: 'selection-returned',
      });
    } finally {
      endNativeSystemUiActivity?.();
    }

    if (result.canceled) {
      return { kind: 'canceled' };
    }

    const processingStartedAt = now();
    const uri = await process(result.asset);
    reportTiming({ durationMs: now() - processingStartedAt, source, step: 'image-processing' });

    return { kind: 'selected', uri };
  }

  return { select };
}
