import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type AppForegroundHandler = () => void;

function isBackgroundState(state: AppStateStatus) {
  return state === 'background' || state === 'inactive';
}

export function useAppForeground(onForeground: AppForegroundHandler) {
  const appStateRef = useRef(AppState.currentState);
  const onForegroundRef = useRef(onForeground);

  useEffect(() => {
    onForegroundRef.current = onForeground;
  }, [onForeground]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;

      appStateRef.current = nextState;

      if (isBackgroundState(previousState) && nextState === 'active') {
        onForegroundRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
