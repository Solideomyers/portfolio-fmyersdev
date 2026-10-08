import { test, expect } from '@playwright/test';
import {
  listNotes,
  notePaths,
  twinOf,
  noteAlternate,
  prevNext,
  noteUrl,
  noteHref,
  dateLabel,
  categoryLabel,
  categoryCounts,
  rfc822,
  rssFeed,
  type NoteData,
} from '../src/lib/notes';

const note = (d: Partial<NoteData>) => ({
  data: {
    id: 'N-01',
    lang: 'en',
    slug: 'a',
    title: 'T',
    dek: 'D',
    date: '2026-10-01',
    category: 'process',
    minutes: 5,
    tags: [],
    draft: false,
    ...d,
  } as NoteData,
});

const all = [
  note({ id: 'N-01', lang: 'en', slug: 'one', date: '2026-10-01', category: 'automation' }),
  note({ id: 'N-01', lang: 'es', slug: 'uno', date: '2026-10-01', category: 'automation' }),
  note({ id: 'N-02', lang: 'en', slug: 'two', date: '2026-11-01' }),
  note({ id: 'N-03', lang: 'es', slug: 'solo-es', date: '2026-12-01' }),
  note({ id: 'N-04', lang: 'en', slug: 'draft', date: '2027-01-01', draft: true }),
];

test('listNotes: newest first, drafts out, other-language-only notes flagged', () => {
  const en = listNotes(all, 'en');
  expect(en.map((n) => [n.data.id, n.data.lang, n.fallback])).toEqual([
    ['N-03', 'es', true],
    ['N-02', 'en', false],
    ['N-01', 'en', false],
  ]);
  expect(noteHref(en[0])).toBe('/es/notas/solo-es');
  expect(listNotes(all, 'es').map((n) => n.data.id)).toEqual(['N-03', 'N-02', 'N-01']);
});

test('notePaths: own published notes only; duplicate slugs throw', () => {
  expect(notePaths(all, 'en').map((p) => p.params.slug)).toEqual(['two', 'one']);
  expect(() => notePaths([...all, note({ id: 'N-09', slug: 'two' })], 'en')).toThrow(/slug/);
  expect(() => notePaths([...all, note({ id: 'N-02', slug: 'other' })], 'en')).toThrow(/N-02/);
});

test('twins and the language switch', () => {
  expect(twinOf(all, all[0])?.data.slug).toBe('uno');
  expect(noteAlternate(all, all[0])).toEqual({ alternate: '/es/notas/uno', hreflang: true });
  // no twin: the other language's notes index, without hreflang
  expect(noteAlternate(all, all[2])).toEqual({ alternate: '/es/notas', hreflang: false });
});

test('prevNext: chronological neighbours, no wrap', () => {
  const en = listNotes(all, 'en');
  expect(prevNext(en, 'N-02')).toEqual({ prev: en[2], next: en[0] });
  expect(prevNext(en, 'N-03').next).toBeUndefined();
  expect(prevNext(en, 'N-01').prev).toBeUndefined();
});

test('labels and counts', () => {
  expect(dateLabel('2026-11-01')).toBe('2026.11');
  expect(categoryLabel('automation', 'es')).toBe('Automatización');
  expect(categoryCounts(listNotes(all, 'en'))).toEqual({
    all: 3,
    process: 2,
    automation: 1,
    engineering: 0,
    cases: 0,
  });
  expect(noteUrl('es', 'x')).toBe('/es/notas/x');
});

test('rssFeed: escaped, absolute links, RFC 822 dates', () => {
  const xml = rssFeed({
    lang: 'en',
    title: 'fmyers.dev — Notes',
    description: 'A & B',
    base: 'https://fmyers.dev',
    items: [{ ...all[2].data, title: 'Tom & "Jerry" <3' }],
  });
  expect(xml).toContain('<title>Tom &amp; &quot;Jerry&quot; &lt;3</title>');
  expect(xml).toContain('<link>https://fmyers.dev/en/notes/two</link>');
  expect(xml).toContain(`<pubDate>${rfc822('2026-11-01')}</pubDate>`);
  expect(rfc822('2026-11-01')).toBe('Sun, 01 Nov 2026 12:00:00 GMT');
  expect(xml).toContain('<description>A &amp; B</description>');
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});

test('notePaths: an impossible date fails the build instead of an Invalid Date feed', () => {
  expect(() => notePaths([note({ id: 'N-07', slug: 'bad', date: '2026-13-45' })], 'en')).toThrow(
    /date/,
  );
});
