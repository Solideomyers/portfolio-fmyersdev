import { test, expect } from '@playwright/test';
import {
  listCases,
  casePaths,
  nextCase,
  twinOf,
  caseUrl,
  statusLabel,
  asOf,
  pad2,
} from '../src/lib/work';
import type { Lang } from '../src/i18n/routes';

const e = (id: string, lang: Lang, slug: string, draft = false) => ({
  data: { id, lang, slug, draft },
});
const all = [
  e('FM-01', 'en', 'churchapp'),
  e('FM-01', 'es', 'churchapp'),
  e('FM-02', 'en', 'chapel'),
  e('FM-02', 'es', 'chapel'),
  e('FM-04', 'en', 'only-en'),
  e('FM-05', 'es', 'draft-es', true),
];

test('listCases: own language first-class, other-language-only as fallback, no drafts, FM desc', () => {
  const es = listCases(all, 'es');
  expect(es.map((x) => [x.entry.data.id, x.entry.data.lang, x.fallback])).toEqual([
    ['FM-04', 'en', true],
    ['FM-02', 'es', false],
    ['FM-01', 'es', false],
  ]);
  expect(listCases(all, 'en').map((x) => x.entry.data.id)).toEqual(['FM-04', 'FM-02', 'FM-01']);
});

test('casePaths: listed cases plus own-language drafts', () => {
  expect(casePaths(all, 'es').map((p) => p.params.slug)).toEqual([
    'only-en',
    'chapel',
    'churchapp',
    'draft-es',
  ]);
  expect(casePaths(all, 'en').map((p) => p.params.slug)).not.toContain('draft-es');
});

test('nextCase: next higher FM-ID, wraps to the lowest, with ascending position', () => {
  const en = listCases(all, 'en');
  expect(nextCase(en, 'FM-01')).toMatchObject({
    entry: { data: { id: 'FM-02' } },
    index: 2,
    total: 3,
  });
  expect(nextCase(en, 'FM-04')).toMatchObject({
    entry: { data: { id: 'FM-01' } },
    index: 1,
    total: 3,
  });
});

test('twinOf, caseUrl, statusLabel, asOf, pad2', () => {
  expect(twinOf(all, all[2])?.data.lang).toBe('es');
  expect(twinOf(all, all[4])).toBeUndefined();
  expect(caseUrl('en', 'chapel')).toBe('/en/work/chapel');
  expect(caseUrl('es', 'chapel')).toBe('/es/proyectos/chapel');
  expect(statusLabel('in-use', 'en')).toBe('IN USE');
  expect(statusLabel('live', 'es')).toBe('EN VIVO');
  expect(statusLabel('wip', 'es')).toBe('PILOTO');
  expect(asOf([{ date: '2026-09' }, { date: '2026-10' }], 'en')).toBe('AS OF OCT 2026');
  expect(asOf([{ date: '2026-08' }], 'es')).toBe('DATOS A AGO 2026');
  expect(asOf([], 'en')).toBe('');
  expect(pad2(3)).toBe('03');
});
