export type LocationPermission = {
  canAskAgain: boolean;
  granted: boolean;
};

export type DeliveryAreaResult =
  | { area: string; kind: 'resolved' }
  | { kind: 'permission-denied'; message: string; needsSettings: boolean }
  | { kind: 'services-disabled'; message: string }
  | { kind: 'unavailable'; message: string };

type DeliveryAreaDependencies = {
  areServicesEnabled: () => Promise<boolean>;
  requestPermission: () => Promise<LocationPermission>;
  resolveArea: () => Promise<string | null>;
};

export function createDeliveryAreaService({
  areServicesEnabled,
  requestPermission,
  resolveArea,
}: DeliveryAreaDependencies) {
  return {
    async getCurrentDeliveryArea(): Promise<DeliveryAreaResult> {
      const permission = await requestPermission();

      if (!permission.granted) {
        return {
          kind: 'permission-denied',
          message: permission.canAskAgain
            ? '未获得定位权限，你可以稍后再次尝试。'
            : '定位权限已关闭，请在系统设置中开启后重试。',
          needsSettings: !permission.canAskAgain,
        };
      }

      if (!(await areServicesEnabled())) {
        return { kind: 'services-disabled', message: '系统定位服务未开启，请开启后重试。' };
      }

      const area = await resolveArea();

      return area
        ? { area, kind: 'resolved' }
        : { kind: 'unavailable', message: '暂时无法获取配送区域，请稍后重试。' };
    },
  };
}
