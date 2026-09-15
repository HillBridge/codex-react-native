let activeSystemUiCount = 0;

export function beginNativeSystemUiActivity() {
  activeSystemUiCount += 1;
  let isReleased = false;

  return () => {
    if (isReleased) {
      return;
    }

    isReleased = true;
    activeSystemUiCount = Math.max(0, activeSystemUiCount - 1);
  };
}

export function isNativeSystemUiActive() {
  return activeSystemUiCount > 0;
}
