import { test, expect } from '@playwright/test';

for (const a of [
  {
    lang: 'en',
    url: '/en/about',
    portrait: 'PORTRAIT · B&W · 4:5',
    work: '/en/work',
    contact: '/en/contact',
  },
  {
    lang: 'es',
    url: '/es/sobre-mi',
    portrait: 'RETRATO · B/N · 4:5',
    work: '/es/proyectos',
    contact: '/es/contacto',
  },
] as const) {
  test(`${a.lang} about: portrait, bio, facts, timeline, stack, cta`, async ({ page }) => {
    await page.goto(a.url);
    await expect(page.locator('.portrait .hatch')).toHaveText(a.portrait);
    await expect(page.locator('.portrait figcaption')).toContainText('FIG. 1');
    await expect(page.locator('.portrait .corner')).toHaveCount(1);
    await expect(page.locator('.bio')).toHaveCount(2);
    await expect(page.locator('.about-facts .cell')).toHaveCount(4);
    await expect(page.locator('.timeline .row')).toHaveCount(6);
    await expect(page.locator('.timeline .year.now')).toHaveCount(2);
    await expect(page.locator('.about-stack .cell')).toHaveCount(6);
    await expect(page.locator('.cta-row a.secondary')).toHaveAttribute('href', a.work);
    await expect(page.locator('.cta-row a.primary')).toHaveAttribute('href', a.contact);
    const levels = await page
      .locator('main :is(h1, h2, h3, h4)')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
  });
}
