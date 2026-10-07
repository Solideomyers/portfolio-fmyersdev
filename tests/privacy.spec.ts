import { test, expect } from '@playwright/test';

for (const p of [
  { url: '/en/privacy', h1: 'Privacy', updated: 'UPDATED 2026-10-06' },
  { url: '/es/privacidad', h1: 'Privacidad', updated: 'ACTUALIZADO 2026-10-06' },
] as const) {
  test(`${p.url}: header, intro, 7 sections, mail button`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page.locator('.sheet-header')).toContainText(p.updated);
    await expect(page.locator('.prose.page h2')).toHaveCount(7);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('.prose.page p').first()).toHaveCSS('color', 'rgb(91, 98, 106)');
    await expect(page.locator('a.mail')).toHaveAttribute('href', 'mailto:hola@fmyers.dev');
  });
}
