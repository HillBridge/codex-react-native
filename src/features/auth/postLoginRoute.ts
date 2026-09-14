export type PostLoginRoute = '/home' | '/profile';

export function getPostLoginRoute(value: unknown): PostLoginRoute {
  return value === '/profile' ? '/profile' : '/home';
}
