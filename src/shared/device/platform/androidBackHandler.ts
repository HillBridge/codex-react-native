export function shouldInterceptAndroidBack({
  isBusy,
  platform,
}: {
  isBusy: boolean;
  platform: string;
}) {
  return platform === 'android' && isBusy;
}
