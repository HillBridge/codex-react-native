export const FOREGROUND_SESSION_REFRESH_DELAY_MS = 1000;

type TimeoutHandle = ReturnType<typeof setTimeout>;

type ForegroundSessionRefreshSchedulerDependencies = {
  clearTimeout: (timeout: TimeoutHandle) => void;
  setTimeout: (task: () => void, delayMs: number) => TimeoutHandle;
};

export function createForegroundSessionRefreshScheduler({
  clearTimeout,
  setTimeout,
}: ForegroundSessionRefreshSchedulerDependencies) {
  let timeout: TimeoutHandle | undefined;

  function cancel() {
    if (timeout === undefined) {
      return;
    }

    clearTimeout(timeout);
    timeout = undefined;
  }

  function schedule(task: () => void) {
    cancel();

    timeout = setTimeout(() => {
      timeout = undefined;
      task();
    }, FOREGROUND_SESSION_REFRESH_DELAY_MS);
  }

  return { cancel, schedule };
}
