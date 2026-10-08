import { test, expect, type Page } from '@playwright/test';

const size = (width: number) => ({ width, height: 900 });
const header = (page: Page) => page.locator('header.site-nav');

for (const w of [1280, 1200]) {
  test(`desktop ${w}: links, switches and CTA; no MENU`, async ({ page }) => {
    await page.setViewportSize(size(w));
    await page.goto('/en/services');
    await expect(header(page).locator('nav')).toBeVisible();
    await expect(header(page).locator('.cta')).toBeVisible();
    await expect(header(page).locator('.tools .lang-switch')).toBeVisible();
    await expect(header(page).locator('.menu-btn')).toBeHidden();
    await expect(header(page).locator('nav a[aria-current="page"]')).toHaveText('01SERVICES');
  });
}

for (const w of [1199, 768]) {
  test(`tablet ${w}: MENU and switches; links hidden`, async ({ page }) => {
    await page.setViewportSize(size(w));
    await page.goto('/en');
    await expect(header(page).locator('nav')).toBeHidden();
    await expect(header(page).locator('.menu-btn')).toBeVisible();
    await expect(header(page).locator('.tools .lang-switch')).toBeVisible();
    await expect(header(page).locator('.tools .theme-toggle')).toBeVisible();
  });
}

test('mobile 375: only MENU', async ({ page }) => {
  await page.setViewportSize(size(375));
  await page.goto('/en');
  await expect(header(page).locator('.menu-btn')).toBeVisible();
  await expect(header(page).locator('.tools .lang-switch')).toBeHidden();
  await expect(header(page).locator('.cta')).toBeHidden();
});

test('menu opens, rows ≥ 52px, Escape closes and refocuses', async ({ page }) => {
  await page.setViewportSize(size(375));
  await page.goto('/es');
  const btn = header(page).locator('.menu-btn');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(btn).toHaveText('CERRAR');
  const rows = page.locator('#site-menu > a');
  await expect(rows).toHaveCount(6); // e2e builds with BLOG_ENABLED=true: 06 NOTAS is in the menu
  for (const h of await rows.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().height),
  )) {
    expect(h).toBeGreaterThanOrEqual(52);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-menu')).toBeHidden();
  await expect(btn).toBeFocused();
  await expect(btn).toHaveText('MENÚ');
});

test('menu closes when the viewport grows to desktop', async ({ page }) => {
  await page.setViewportSize(size(768));
  await page.goto('/en');
  await header(page).locator('.menu-btn').click();
  await page.setViewportSize(size(1280));
  await expect(header(page).locator('.menu-btn')).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize(size(768));
  await expect(page.locator('#site-menu')).toBeHidden();
  await expect(header(page).locator('.menu-btn')).toHaveAttribute('aria-expanded', 'false');
});

// e2e builds with BLOG_ENABLED=true; the disabled build is checked by scripts/check-blog-hidden.mjs in CI.
test('06 NOTES joins the nav when the blog is enabled', async ({ page }) => {
  await page.goto('/en');
  await expect(header(page).locator('nav a', { hasText: 'NOTES' })).toHaveAttribute(
    'href',
    '/en/notes',
  );
  await expect(header(page).locator('nav a', { hasText: 'NOTES' })).toContainText('06');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: size(375) });
  test('menu links are reachable', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('#site-menu > a').first()).toBeVisible();
    await expect(header(page).locator('.menu-btn')).toBeHidden();
  });
});
