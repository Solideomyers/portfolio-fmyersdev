import { test, expect } from '@playwright/test';

const cases = [
  {
    url: '/en/work/chapel',
    lang: 'en',
    h1: 'Chapel',
    twin: '/es/proyectos/chapel',
    next: '/en/work/churchapp',
    nextMeta: '01 / 02',
    img: true,
    fig2: false,
  },
  {
    url: '/en/work/churchapp',
    lang: 'en',
    h1: 'ChurchApp',
    twin: '/es/proyectos/churchapp',
    next: '/en/work/chapel',
    nextMeta: '02 / 02',
    img: false,
    fig2: true,
  },
  {
    url: '/es/proyectos/chapel',
    lang: 'es',
    h1: 'Chapel',
    twin: '/en/work/chapel',
    next: '/es/proyectos/churchapp',
    nextMeta: '01 / 02',
    img: true,
    fig2: false,
  },
  {
    url: '/es/proyectos/churchapp',
    lang: 'es',
    h1: 'ChurchApp',
    twin: '/en/work/churchapp',
    next: '/es/proyectos/chapel',
    nextMeta: '02 / 02',
    img: false,
    fig2: true,
  },
] as const;

for (const c of cases) {
  test(`${c.url}: header, figures, sections, metrics, next, twin`, async ({ page }) => {
    const res = await page.goto(c.url);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', c.lang);
    await expect(page.locator('h1')).toHaveText(c.h1);
    await expect(page.locator('.case-frame .spec-grid .cell')).toHaveCount(4);
    await expect(page.locator('.fig1 figcaption')).toContainText('FIG. 1');
    await expect(page.locator('.fig1 img')).toHaveCount(c.img ? 1 : 0);
    await expect(page.locator('.prose h2')).toHaveCount(5);
    // FIG. 2 sits between the 4th and 5th h2; metrics after the 5th.
    const order = await page
      .locator('.prose')
      .evaluate((el) =>
        [...el.querySelectorAll('h2, figure, .metrics')].map((n) =>
          n.tagName === 'H2' ? 'h2' : n.classList.contains('metrics') ? 'metrics' : 'fig',
        ),
      );
    expect(order).toEqual(
      c.fig2
        ? ['h2', 'h2', 'h2', 'h2', 'fig', 'h2', 'metrics']
        : ['h2', 'h2', 'h2', 'h2', 'h2', 'metrics'],
    );
    await expect(page.locator('.metrics .as-of')).toHaveText(/^(AS OF|DATOS A) [A-Z]{3} 2026$/);
    await expect(page.locator('a.card.next')).toHaveAttribute('href', c.next);
    await expect(page.locator('.next-section .sheet-header')).toContainText(c.nextMeta);
    await expect(page.locator('header .tools .lang-switch a')).toHaveAttribute('href', c.twin);
  });
}

test('TOC desktop: 5 anchors to existing ids; clicking Outcome marks it current', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/work/churchapp');
  const links = page.locator('.toc-side a');
  await expect(links).toHaveCount(5);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await links.nth(4).click();
  await expect(links.nth(4)).toHaveAttribute('aria-current', 'location');
  await expect(links.nth(0)).not.toHaveAttribute('aria-current', 'location');
});

test('TOC mobile: collapsed, opens, picking a row closes it and scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/en/work/chapel');
  await expect(page.locator('.toc-side')).toBeHidden();
  const btn = page.locator('.toc-block button');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.toc-block a').nth(2).click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#constraints$/);
  await expect(btn).toContainText('03/05');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });
  test('TOC links are visible', async ({ page }) => {
    await page.goto('/en/work/chapel');
    await expect(page.locator('.toc-block a').first()).toBeVisible();
  });
});
