import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const fm = (path: string) => {
  const text = readFileSync(path, 'utf8');
  const get = (k: string) => text.match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1].trim();
  return { id: get('id'), from: get('from'), billing: get('billing'), featured: get('featured') };
};

test('every package exists in both languages with the same id, price and billing', () => {
  const en = readdirSync('src/content/pricing/en').sort();
  const es = readdirSync('src/content/pricing/es').sort();
  expect(es).toEqual(en);
  expect(en).toHaveLength(3);
  for (const file of en) {
    expect(fm(`src/content/pricing/es/${file}`), file).toEqual(
      fm(`src/content/pricing/en/${file}`),
    );
  }
});

test('faq: Services has Q-07…Q-10 only, Pricing Q-01…Q-06 (design decision A)', () => {
  for (const lang of ['en', 'es']) {
    const items = JSON.parse(readFileSync(`src/content/faq/${lang}.json`, 'utf8')) as {
      id: string;
      page: string;
    }[];
    const on = (page: string) =>
      items.filter((i) => i.page === page || i.page === 'both').map((i) => i.id);
    expect(on('services')).toEqual(['Q-07', 'Q-08', 'Q-09', 'Q-10']);
    expect(on('pricing')).toEqual(['Q-01', 'Q-02', 'Q-03', 'Q-04', 'Q-05', 'Q-06']);
  }
});
