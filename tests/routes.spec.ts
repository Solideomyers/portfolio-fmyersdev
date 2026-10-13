import { test, expect } from '@playwright/test';
import { ROUTES, LANGS, navKeyOf, type RouteKey } from '../src/i18n/routes';
import { ui } from '../src/i18n/ui';

for (const key of Object.keys(ROUTES) as RouteKey[]) {
  for (const lang of LANGS) {
    const url = ROUTES[key][lang];
    test(`${url} renders the shell`, async ({ page, request }) => {
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(ui[lang].h1[key]);
      await expect(page.locator('header nav a[aria-current="page"]')).toHaveCount(
        navKeyOf(url) ? 1 : 0,
      );
      const hrefs = await page
        .locator('link[rel="alternate"], link[rel="canonical"]')
        .evaluateAll((els) => els.map((e) => new URL(e.getAttribute('href')!).pathname));
      expect(hrefs.length).toBeGreaterThanOrEqual(4);
      for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
    });
  }
}

test('trailing slash keeps aria-current and the language twin', async ({ page }) => {
  await page.goto('/es/servicios/');
  await expect(page.locator('header nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    '/es/servicios',
  );
  await expect(page.locator('header .tools .lang-switch a[hreflang="en"]')).toHaveAttribute(
    'href',
    '/en/services',
  );
});
