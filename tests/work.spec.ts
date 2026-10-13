import { test, expect } from '@playwright/test';

const pages = [
  ['en', '/en/work', '02 CASE STUDIES · 03 REPOS', '/en/work/', '/en/contact'],
  ['es', '/es/proyectos', '02 CASOS · 03 REPOS', '/es/proyectos/', '/es/contacto'],
] as const;

for (const [lang, url, count, caseBase, contact] of pages) {
  test(`${lang} work index: count, cards newest first, other work, CTA`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('.sheet-header').first()).toContainText(count);
    const cards = page.locator('a.card.grid');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).locator('.id')).toHaveText('FM-02');
    await expect(cards.nth(1).locator('.id')).toHaveText('FM-01');
    await expect(cards.nth(0)).toHaveAttribute('href', `${caseBase}chapel`);
    const rows = page.locator('a.post-row');
    await expect(rows).toHaveCount(3);
    for (const href of await rows.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/github\.com\/Solideomyers\//);
    }
    await expect(page.locator('.cta-row a.btn')).toHaveAttribute('href', contact);
  });
}
