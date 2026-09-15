import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';

import { createDeliveryAreaService, type LocationPermission } from './deliveryAreaService';

async function requestPermission(): Promise<LocationPermission> {
  if (Platform.OS === 'android') {
    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    const values = Object.values(permissions);

    return {
      canAskAgain: !values.every((value) => value === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN),
      granted: values.some((value) => value === PermissionsAndroid.RESULTS.GRANTED),
    };
  }

  const permission = await Location.requestForegroundPermissionsAsync();

  return { canAskAgain: permission.canAskAgain, granted: permission.granted };
}

async function resolveArea() {
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [address] = await Location.reverseGeocodeAsync(position.coords);

  if (!address) {
    return null;
  }

  const area = [address.city, address.district, address.subregion]
    .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
    .join(' ');

  return area || null;
}

export const deliveryAreaService = createDeliveryAreaService({
  areServicesEnabled: () => Location.hasServicesEnabledAsync(),
  requestPermission,
  resolveArea,
});

export function getCurrentDeliveryArea() {
  return deliveryAreaService.getCurrentDeliveryArea();
}
