import assert from 'node:assert/strict';
import test from 'node:test';

import { createForegroundSessionRefreshScheduler } from '../../src/features/auth/foregroundSessionRefresh.ts';

test('前台会话刷新在页面恢复后再执行，并可在再次离开前台时取消', () => {
  let nextId = 0;
  const pending = new Map<number, () => void>();
  const ran: string[] = [];
  const delays: number[] = [];
  const scheduler = createForegroundSessionRefreshScheduler({
    clearTimeout: (id) => pending.delete(id as number),
    setTimeout: (task, delayMs) => {
      nextId += 1;
      pending.set(nextId, task);
      delays.push(delayMs);
      return nextId as unknown as ReturnType<typeof setTimeout>;
    },
  });

  scheduler.schedule(() => ran.push('first'));
  assert.deepEqual(ran, []);
  assert.equal(pending.size, 1);

  scheduler.cancel();
  assert.equal(pending.size, 0);

  scheduler.schedule(() => ran.push('second'));
  const entry = [...pending.entries()][0];
  assert.ok(entry);
  pending.delete(entry[0]);
  entry[1]();

  assert.deepEqual(ran, ['second']);
  assert.equal(pending.size, 0);
  assert.deepEqual(delays, [1000, 1000]);
});
