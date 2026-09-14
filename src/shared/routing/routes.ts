export const APP_ROUTES = {
  home: '/home',
  login: '/login',
  products: '/products',
  profile: '/profile',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
