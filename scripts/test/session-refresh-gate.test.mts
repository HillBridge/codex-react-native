import assert from 'node:assert/strict';
import test from 'node:test';

import { createSessionRefreshGate } from '../../src/features/auth/sessionRefreshGate.ts';

test('会话刷新进行中时忽略重复的前台刷新请求', async () => {
  const gate = createSessionRefreshGate();
  let resolveFirstRefresh: (() => void) | undefined;
  let refreshCount = 0;

  const firstRefresh = gate.run(
    () =>
      new Promise<void>((resolve) => {
        refreshCount += 1;
        resolveFirstRefresh = resolve;
      }),
  );
  const duplicateRefresh = gate.run(async () => {
    refreshCount += 1;
  });

  assert.equal(await duplicateRefresh, false);
  assert.equal(refreshCount, 1);

  resolveFirstRefresh?.();
  assert.equal(await firstRefresh, true);

  assert.equal(
    await gate.run(async () => {
      refreshCount += 1;
    }),
    true,
  );
  assert.equal(refreshCount, 2);
});
