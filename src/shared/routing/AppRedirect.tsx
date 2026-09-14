import { Redirect, type Href } from 'expo-router';

type AppRedirectProps = {
  to: Href;
};

export function AppRedirect({ to }: AppRedirectProps) {
  return <Redirect href={to} />;
}
