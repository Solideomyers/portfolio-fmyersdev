import { test, expect } from '@playwright/test';

const DARK = 'rgb(14, 17, 20)';
const LIGHT = 'rgb(242, 243, 239)';

test('follows the OS when nothing is stored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
  await expect(page.locator('header .wm-dark')).toBeVisible();
  expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
});

test('toggle flips the effective theme and persists it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en');
  await page.locator('header .tools .theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
  await expect(page.locator('header .wm-light')).toBeVisible();
  await expect(page.locator('header .wm-dark')).toBeHidden();
});

test('stored theme is applied before the body is parsed', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    new MutationObserver((_, obs) => {
      if (document.body) {
        (window as unknown as { __t: string | null }).__t =
          document.documentElement.dataset.theme ?? null;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/en');
  expect(await page.evaluate(() => (window as unknown as { __t: string | null }).__t)).toBe('dark');
});

test('blocked localStorage: page renders and toggle still works', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('/en');
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('header .tools .theme-toggle').click();
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('the whole canvas uses --bg, not just the body box', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 768, height: 1400 });
  await page.goto('/es');
  const corner = await page.evaluate(() => {
    const el = document.elementFromPoint(5, window.innerHeight - 5);
    return getComputedStyle(el === document.documentElement ? el : document.documentElement)
      .backgroundColor;
  });
  expect(corner).toBe(DARK);
});
