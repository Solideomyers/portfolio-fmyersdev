import { test, expect } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFiles, writeFiles } from '../src/lib/snapshot-fs';
import { isManaged, validateFiles } from '../src/lib/snapshot';

const flatten = (v: unknown, p = ''): string[] =>
  v && typeof v === 'object'
    ? Object.entries(v).flatMap(([k, x]) => flatten(x, p ? `${p}.${k}` : k))
    : [p];

test('isManaged covers content, ui json and site data only', () => {
  expect(isManaged('src/content/work/en/fm-01-churchapp.mdx')).toBe(true);
  expect(isManaged('src/i18n/ui.en.json')).toBe(true);
  expect(isManaged('src/config/site.data.json')).toBe(true);
  expect(isManaged('src/pages/index.astro')).toBe(false);
});

test('repo content validates', () => {
  expect(validateFiles(readFiles('.'))).toEqual([]);
});

test('round trip is byte-identical', () => {
  const files = readFiles('.');
  const tmp = mkdtempSync(join(tmpdir(), 'snap-'));
  writeFiles(files, tmp);
  expect(readFiles(tmp)).toEqual(files);
  for (const p of Object.keys(files))
    expect(readFileSync(join(tmp, p)).equals(readFileSync(p))).toBe(true);
});

test('ui languages have identical key paths', () => {
  const f = readFiles('.');
  const en = flatten(JSON.parse(f['src/i18n/ui.en.json']));
  const es = flatten(JSON.parse(f['src/i18n/ui.es.json']));
  expect(en.length).toBeGreaterThan(100);
  expect(es).toEqual(en);
});

test('validateFiles names a pricing twin that disagrees on price', () => {
  const files = readFiles('.');
  const p = Object.keys(files).find((k) => /pricing\/en\/p-01/.test(k))!;
  files[p] = files[p].replace(/^from: .*/m, 'from: 1');
  const errors = validateFiles(files);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.join('\n')).toContain('p-01');
});
