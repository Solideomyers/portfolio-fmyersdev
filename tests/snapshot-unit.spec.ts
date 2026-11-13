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

test('validateFiles: a published case study needs its texts, a draft one does not', () => {
  const files = readFiles('.');
  const p = Object.keys(files).find((k) => /work\/en\/fm-01/.test(k))!;
  const emptyTitle = files[p].replace(/^title: .*/m, "title: ''");
  expect(validateFiles({ ...files, [p]: emptyTitle }).join('\n')).toContain(
    `${p}: title: required text`,
  );
  const asDraft = emptyTitle.replace(/^draft: .*/m, 'draft: true');
  expect(validateFiles({ ...files, [p]: asDraft })).toEqual([]);
});

test('validateFiles: a published case study needs a cover image path', () => {
  const files = readFiles('.');
  const p = Object.keys(files).find((k) => /work\/es\/fm-02/.test(k))!;
  const noCover = files[p].replace(/(cover:[\s\S]*?src: )[^,\n]+/, '$1""');
  expect(noCover).not.toBe(files[p]);
  expect(validateFiles({ ...files, [p]: noCover }).join('\n')).toContain(`${p}: cover.src`);
});

test('validateFiles: two case studies with the same slug in one language are refused', () => {
  const files = readFiles('.');
  const [a, b] = Object.keys(files).filter((k) => /work\/en\/.+\.mdx$/.test(k));
  files[b] = files[b].replace(/^slug: .*/m, files[a].match(/^slug: .*/m)![0]);
  expect(validateFiles(files).join('\n')).toContain('is also used by');
});
