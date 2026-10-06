import { test, expect } from '@playwright/test';

test('home responds 200 and shows the wordmark', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('img', { name: 'fmyers.dev' })).toBeVisible();
});

test('no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});

const schemes = [
  ['light', 'rgb(242, 243, 239)'],
  ['dark', 'rgb(14, 17, 20)'],
] as const;

for (const [scheme, bg] of schemes) {
  test(`body uses the ${scheme} --bg`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', bg);
  });
}
