import { test, expect } from '@playwright/test';
import { ROUTES, LANGS, path, langOf, routeKeyOf, alternateOf } from '../src/i18n/routes';
import { ui } from '../src/i18n/ui';

test('route map: unique URLs, correct prefixes', () => {
  const all = Object.values(ROUTES).flatMap((r) => [r.en, r.es]);
  expect(new Set(all).size).toBe(all.length);
  for (const r of Object.values(ROUTES)) {
    expect(r.en === '/en' || r.en.startsWith('/en/')).toBe(true);
    expect(r.es === '/es' || r.es.startsWith('/es/')).toBe(true);
  }
});

test('routeKeyOf ignores trailing slash and unknown paths', () => {
  expect(routeKeyOf('/en')).toBe('home');
  expect(routeKeyOf('/es/servicios/')).toBe('services');
  expect(routeKeyOf('/en/nope')).toBeUndefined();
});

test('alternateOf maps, falls back to home, honours overrides', () => {
  expect(alternateOf('/en/services')).toBe('/es/servicios');
  expect(alternateOf('/es/sobre-mi/')).toBe('/en/about');
  expect(alternateOf('/en/work/fm-01-churchapp')).toBe('/es');
  expect(alternateOf('/en/work/x', '/es/proyectos/x')).toBe('/es/proyectos/x');
  expect(alternateOf('/en/notes/x', null)).toBeNull();
});

test('path and langOf', () => {
  expect(path('pricing', 'es')).toBe('/es/precios');
  expect(langOf('/es/precios')).toBe('es');
  expect(langOf('/en')).toBe('en');
});

test('every route has an h1 in both languages', () => {
  for (const lang of LANGS) {
    for (const key of Object.keys(ROUTES) as (keyof typeof ROUTES)[]) {
      expect(ui[lang].h1[key], `${lang}.${key}`).toBeTruthy();
    }
  }
});
