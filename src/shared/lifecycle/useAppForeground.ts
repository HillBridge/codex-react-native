import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type AppForegroundHandler = () => void;
type AppBackgroundHandler = () => void;

function isBackgroundState(state: AppStateStatus) {
  return state === 'background' || state === 'inactive';
}

export function useAppForeground(
  onForeground: AppForegroundHandler,
  onBackground?: AppBackgroundHandler,
) {
  const appStateRef = useRef(AppState.currentState);
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);

  useEffect(() => {
    onForegroundRef.current = onForeground;
  }, [onForeground]);

  useEffect(() => {
    onBackgroundRef.current = onBackground;
  }, [onBackground]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;

      appStateRef.current = nextState;

      if (isBackgroundState(nextState)) {
        onBackgroundRef.current?.();
      }

      if (isBackgroundState(previousState) && nextState === 'active') {
        onForegroundRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
