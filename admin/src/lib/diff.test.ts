import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diffFiles } from './diff.ts';

test('a one-line change lists only the changed lines', () => {
  const d = diffFiles({ 'a.md': 'x\nold\nz\n' }, { 'a.md': 'x\nnew\nz\n' });
  assert.deepEqual(d, [{ path: 'a.md', kind: 'changed', removed: ['old'], added: ['new'] }]);
});

test('an added and a removed file', () => {
  const d = diffFiles({ 'gone.md': 'a\nb\n' }, { 'new.md': 'c\n' });
  assert.deepEqual(d, [
    { path: 'gone.md', kind: 'removed', removed: ['a', 'b'], added: [] },
    { path: 'new.md', kind: 'added', removed: [], added: ['c'] },
  ]);
});

test('equal files and repeated lines', () => {
  assert.deepEqual(diffFiles({ a: 'x\n' }, { a: 'x\n' }), []);
  const [d] = diffFiles({ a: 'x\nx\n' }, { a: 'x\n' });
  assert.deepEqual(d.removed, ['x']);
});
