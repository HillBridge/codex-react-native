export type HapticFeedbackKind = 'error' | 'selection' | 'success';

type HapticFeedbackDependencies = {
  error: () => Promise<void>;
  selection: () => Promise<void>;
  success: () => Promise<void>;
};

export function createHapticFeedbackService({
  error,
  selection,
  success,
}: HapticFeedbackDependencies) {
  return {
    trigger(kind: HapticFeedbackKind) {
      if (kind === 'success') {
        return success();
      }

      if (kind === 'error') {
        return error();
      }

      return selection();
    },
  };
}
