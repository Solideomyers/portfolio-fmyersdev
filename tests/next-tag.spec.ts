import { test, expect } from '@playwright/test';
import { nextTag } from '../scripts/next-tag.mjs';

const tags = ['v0.1.0', 'v0.9.0', 'v0.10.0', 'v0.2.0', 'not-a-tag'];

test('default: minor bump of the highest semver tag', () => {
  expect(nextTag({ tags, message: 'feat(x): y' })).toBe('v0.11.0');
  expect(nextTag({ tags: [], message: '' })).toBe('v0.1.0');
  expect(nextTag({ tags: [...tags, 'v1.0.0'], message: 'fix(x): y' })).toBe('v1.1.0');
});

test('Release-As overrides when greater; lower, equal or malformed fail', () => {
  expect(nextTag({ tags, message: 'chore: launch\n\nRelease-As: v1.0.0\n' })).toBe('v1.0.0');
  expect(() => nextTag({ tags, message: 'Release-As: v0.10.0' })).toThrow(/greater/);
  expect(() => nextTag({ tags, message: 'Release-As: v0.3.0' })).toThrow(/greater/);
  expect(() => nextTag({ tags, message: 'Release-As: 1.0' })).toThrow(/vX\.Y\.Z/);
});

test('Release-As near misses fail instead of being ignored; values are normalised', () => {
  for (const message of [
    '- Release-As: v1.0.0',
    'Release-As: v1.0.0 (launch)',
    'release-as: v1.0.0',
    '`Release-As: v1.0.0`',
  ])
    expect(() => nextTag({ tags, message }), message).toThrow(/Release-As/);
  expect(nextTag({ tags, message: 'Release-As: v01.0.0' })).toBe('v1.0.0');
});
