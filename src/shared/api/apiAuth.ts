type AccessTokenGetter = () => string | undefined;
type AccessTokenRefreshHandler = () => Promise<string | undefined>;
type UnauthorizedHandler = () => Promise<void> | void;

type ApiAuthHandlerOptions = {
  ignoredPaths?: readonly string[];
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: AccessTokenRefreshHandler;
};

let getAccessToken: AccessTokenGetter = () => undefined;
let ignoredAuthRefreshPaths: readonly string[] = [];
let onUnauthorized: UnauthorizedHandler | undefined;
let refreshAccessToken: AccessTokenRefreshHandler | undefined;
let refreshPromise: Promise<string | undefined> | null = null;
let unauthorizedPromise: Promise<void> | null = null;

export function configureAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter;
}

export function configureApiAuthHandlers(options: ApiAuthHandlerOptions) {
  ignoredAuthRefreshPaths = options.ignoredPaths ?? ignoredAuthRefreshPaths;
  onUnauthorized = options.onUnauthorized ?? onUnauthorized;
  refreshAccessToken = options.refreshAccessToken ?? refreshAccessToken;
}

export function getCurrentAccessToken() {
  return getAccessToken();
}

export function isAuthRefreshIgnored(url?: string) {
  const requestUrl = url ?? '';

  return ignoredAuthRefreshPaths.some((path) => requestUrl.includes(path));
}

export async function getFreshAccessToken() {
  if (!refreshAccessToken) {
    return undefined;
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function notifyUnauthorized() {
  if (!onUnauthorized) {
    return;
  }

  unauthorizedPromise ??= Promise.resolve(onUnauthorized()).finally(() => {
    unauthorizedPromise = null;
  });

  await unauthorizedPromise;
}
