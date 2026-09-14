type SessionRefreshTask = () => Promise<void>;

export function createSessionRefreshGate() {
  let isRefreshing = false;

  return {
    async run(task: SessionRefreshTask) {
      if (isRefreshing) {
        return false;
      }

      isRefreshing = true;

      try {
        await task();
        return true;
      } finally {
        isRefreshing = false;
      }
    },
  };
}
