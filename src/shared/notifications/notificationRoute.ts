type NotificationData = { url?: unknown } | null | undefined;

const PRODUCT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveNotificationRoute(data: NotificationData): `/products/${string}` | null {
  if (!data || typeof data.url !== 'string') {
    return null;
  }

  try {
    const url = new URL(data.url);
    const slug = url.pathname.slice(1);

    if (url.protocol !== 'rnmall:' || url.hostname !== 'products' || !PRODUCT_SLUG.test(slug)) {
      return null;
    }

    return `/products/${slug}`;
  } catch {
    return null;
  }
}
