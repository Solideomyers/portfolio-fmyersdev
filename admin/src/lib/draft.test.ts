import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlay, withDraft } from './draft.ts';

const current = { 'a.md': 'A', 'b.md': 'B' };

test('overlay applies edits, new files and deletions without touching the published map', () => {
  const out = overlay(current, { 'a.md': 'A2', 'c.md': 'C', 'b.md': null });
  assert.deepEqual(out, { 'a.md': 'A2', 'c.md': 'C' });
  assert.deepEqual(current, { 'a.md': 'A', 'b.md': 'B' });
});

test('withDraft keeps only real changes, like draft_set_file', () => {
  const edited = withDraft({}, current, 'a.md', 'A2');
  assert.deepEqual(edited, { 'a.md': 'A2' });
  assert.deepEqual(withDraft(edited, current, 'a.md', 'A'), {});
  assert.deepEqual(withDraft({}, current, 'new.md', null), {}); // deleting a file that never existed
  assert.deepEqual(withDraft({}, current, 'b.md', null), { 'b.md': null });
});
