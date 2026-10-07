import { test, expect } from '@playwright/test';
import { availability, featuredCases } from '../src/lib/home';
import type { Lang } from '../src/i18n/routes';

test('availability: dated before the month, dateless from its first day (UTC)', () => {
  expect(availability('2026-11', new Date('2026-10-31T23:59:59Z'), 'en')).toEqual({
    text: 'Available for new projects from Nov 2026',
    dated: true,
  });
  expect(availability('2026-11', new Date('2026-10-07T12:00:00Z'), 'es')).toEqual({
    text: 'Disponible para nuevos proyectos desde nov 2026',
    dated: true,
  });
  expect(availability('2026-11', new Date('2026-11-01T00:00:00Z'), 'en')).toEqual({
    text: 'Available for new projects',
    dated: false,
  });
  expect(availability('2026-11', new Date('2027-03-01T00:00:00Z'), 'es').text).toBe(
    'Disponible para nuevos proyectos',
  );
  expect(() => availability('Nov 2026', new Date(), 'en')).toThrow(/YYYY-MM/);
});

const c = (id: string, lang: Lang, featured: boolean, order: number, draft = false) => ({
  data: { id, lang, featured, order, draft },
});

test('featuredCases: own language, featured, not draft, by order, max 3', () => {
  const all = [
    c('FM-02', 'en', true, 2),
    c('FM-01', 'en', true, 1),
    c('FM-05', 'en', true, 5),
    c('FM-04', 'en', true, 4),
    c('FM-06', 'en', true, 0, true),
    c('FM-07', 'en', false, 0),
    c('FM-01', 'es', true, 1),
  ];
  expect(featuredCases(all, 'en').map((e) => e.data.id)).toEqual(['FM-01', 'FM-02', 'FM-04']);
  expect(featuredCases(all, 'es').map((e) => e.data.id)).toEqual(['FM-01']);
  expect(featuredCases([], 'en')).toEqual([]);
});
