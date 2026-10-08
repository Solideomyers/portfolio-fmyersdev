import { test, expect, type Page } from '@playwright/test';

const vtNames = (page: Page) =>
  page.$$eval('*', (els) =>
    els
      .map((e) => getComputedStyle(e).viewTransitionName)
      .filter((n) => n && n !== 'none' && n !== 'root'),
  );

test('html.js and the cross-document view-transition rules are present', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  const css = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join('\n'),
  );
  expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
  expect(css).toMatch(
    /::view-transition-new\(root\)[^{]*\{[^}]*animation-duration:\s*var\(--dur-fade\)/,
  );
});

for (const url of ['/en', '/en/work', '/en/work/churchapp', '/es/proyectos/chapel']) {
  test(`${url}: view-transition names are unique`, async ({ page }) => {
    await page.goto(url);
    const names = await vtNames(page);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });
}

test('a work card and its case header share sheet-{id}', async ({ page }) => {
  await page.goto('/en/work');
  const card = page.locator('a.card.grid').first();
  const name = await card.evaluate((e) => getComputedStyle(e).viewTransitionName);
  expect(name).toMatch(/^sheet-fm-\d\d$/);
  await page.goto((await card.getAttribute('href'))!);
  await expect(page.locator('.case-frame')).toHaveCSS('view-transition-name', name);
});
