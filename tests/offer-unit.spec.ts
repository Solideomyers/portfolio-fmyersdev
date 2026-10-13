import { test, expect } from '@playwright/test';
import { formatUsd, unitLabel, priceShort, faqFor, byOrder } from '../src/lib/offer';
import type { Lang } from '../src/i18n/routes';

const f = (qid: string, lang: Lang, page: 'pricing' | 'services' | 'both', order: number) => ({
  data: { qid, lang, page, order },
});

test('price formatting', () => {
  expect(formatUsd(4500)).toBe('$4,500');
  expect(formatUsd(900)).toBe('$900');
  expect(unitLabel('project', 'en')).toBe('PER PROJECT');
  expect(unitLabel('month', 'es')).toBe('AL MES');
  expect(priceShort({ from: 900, billing: 'project' }, 'en')).toBe('$900');
  expect(priceShort({ from: 2800, billing: 'month' }, 'en')).toBe('$2,800 / mo');
  expect(priceShort({ from: 2800, billing: 'month' }, 'es')).toBe('$2,800 / mes');
});

test('faqFor: page or both, language-scoped, sorted by order, no duplicates', () => {
  const all = [
    f('Q-03', 'en', 'pricing', 3),
    f('Q-01', 'en', 'pricing', 1),
    f('Q-02', 'en', 'both', 2),
    f('Q-07', 'en', 'services', 7),
    f('Q-01', 'es', 'pricing', 1),
  ];
  expect(faqFor(all, 'pricing', 'en').map((x) => x.data.qid)).toEqual(['Q-01', 'Q-02', 'Q-03']);
  expect(faqFor(all, 'services', 'en').map((x) => x.data.qid)).toEqual(['Q-02', 'Q-07']);
  expect(faqFor(all, 'pricing', 'es').map((x) => x.data.qid)).toEqual(['Q-01']);
});

test('byOrder', () => {
  expect(
    byOrder([{ data: { order: 2 } }, { data: { order: 1 } }]).map((x) => x.data.order),
  ).toEqual([1, 2]);
});
