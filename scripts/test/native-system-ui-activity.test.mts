import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginNativeSystemUiActivity,
  isNativeSystemUiActive,
} from '../../src/shared/lifecycle/nativeSystemUiActivity.ts';

test('原生系统界面活动可嵌套且释放操作幂等', () => {
  const first = beginNativeSystemUiActivity();
  const second = beginNativeSystemUiActivity();

  assert.equal(isNativeSystemUiActive(), true);

  first();
  assert.equal(isNativeSystemUiActive(), true);

  second();
  second();
  assert.equal(isNativeSystemUiActive(), false);
});
