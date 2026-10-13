import { test, expect } from '@playwright/test';

const ACCENT_LIGHT = 'rgb(43, 85, 200)';

test('links use the accent colour by default (handoff base link style)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en');
  await expect(page.locator('footer a', { hasText: 'GITHUB' })).toHaveCSS('color', ACCENT_LIGHT);
});

test('theme is re-applied when a page is restored from the back/forward cache', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en');
  // Simulate: another page stored dark, then this page comes back from bfcache with stale attributes.
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    delete document.documentElement.dataset.theme;
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('404 sheet: back arrow on home, bordered links, path shown as typed', async ({ page }) => {
  await page.goto('/en/Some-Path');
  await expect(page.locator('.l-en a.btn')).toHaveText(/^← /);
  await expect(page.locator('.l-en a.sheet-link').first()).toHaveCSS('border-top-style', 'solid');
  await expect(page.locator('.l-en [data-path]')).toHaveCSS('text-transform', 'none');
  await expect(page.locator('.l-en .tag')).toHaveText('404 · NOT FOUND');
});

test('404 with a long path does not overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/en/' + 'a'.repeat(80));
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
