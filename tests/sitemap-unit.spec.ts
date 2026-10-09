import { test, expect } from '@playwright/test';
import { sitemapXml } from '../src/lib/sitemap';

test('twins get en/es/x-default alternates; single-language pages none', () => {
  const xml = sitemapXml('https://x.app', [{ en: '/en/a', es: '/es/a' }, { en: '/en/solo' }]);
  expect(xml).toContain('<loc>https://x.app/en/a</loc>');
  expect(xml).toContain('<loc>https://x.app/es/a</loc>');
  expect(xml.match(/hreflang="x-default" href="https:\/\/x\.app\/en\/a"/g)).toHaveLength(2);
  expect(xml).toMatch(/<url><loc>https:\/\/x\.app\/en\/solo<\/loc><\/url>/);
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});
