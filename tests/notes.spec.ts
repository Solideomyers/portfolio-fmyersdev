import { test, expect } from '@playwright/test';

const idx = [
  {
    lang: 'en',
    url: '/en/notes',
    sheet: 'SHEET 07 — NOTES',
    h1: 'Notes',
    rss: '/en/notes/rss.xml',
    all: 'All',
    empty: 'Automation',
    note: '/en/notes/one-page-spec',
    foot: 'PROCESS · 6 MIN',
  },
  {
    lang: 'es',
    url: '/es/notas',
    sheet: 'LÁMINA 07 — NOTAS',
    h1: 'Notas',
    rss: '/es/notas/rss.xml',
    all: 'Todo',
    empty: 'Automatización',
    note: '/es/notas/especificacion-de-una-pagina',
    foot: 'PROCESO · 6 MIN',
  },
] as const;

for (const p of idx) {
  test(`${p.url}: header, rss, chips and rows`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('.notes-head .sheet-header')).toContainText(p.sheet);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page.locator('.notes-head a', { hasText: 'RSS ↗' })).toHaveAttribute(
      'href',
      p.rss,
    );
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      'href',
      `https://fmyers.dev${p.rss}`, // feeds are advertised with absolute URLs
    );
    const chips = page.locator('.notes-chips button');
    await expect(chips).toHaveCount(5);
    await expect(chips.nth(0)).toHaveText(new RegExp(`^${p.all}\\s*1$`));
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.note-row')).toHaveCount(1);
    await expect(page.locator('.note-row').first()).toHaveAttribute('href', p.note);
    await expect(page.locator('.note-row .foot')).toHaveText(
      new RegExp(p.foot.replace(' · ', '\\s*·\\s*')),
    ); // flex gap, no text spaces
  });

  test(`${p.url}: an empty category shows the empty state; show all restores`, async ({ page }) => {
    await page.goto(p.url);
    await page.locator('.notes-chips button', { hasText: p.empty }).click();
    await expect(page.locator('.note-row').first()).toBeHidden();
    await expect(page.locator('.notes-empty')).toBeVisible();
    await page.locator('.notes-empty button').click();
    await expect(page.locator('.note-row').first()).toBeVisible();
    await expect(page.locator('.notes-chips button').nth(0)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test.describe('notes index without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every row shows, nothing is pressed, no empty state', async ({ page }) => {
    await page.goto('/en/notes');
    await expect(page.locator('.note-row')).toHaveCount(1);
    await expect(page.locator('.notes-chips [aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.notes-empty')).toBeHidden();
  });
});
