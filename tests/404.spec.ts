import { test, expect } from '@playwright/test';

test('/en/nope → English 404 showing the path', async ({ page }) => {
  const res = await page.goto('/en/nope');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.l-en h1')).toHaveText("This sheet isn't in the set.");
  await expect(page.locator('.l-en [data-path]')).toHaveText('/en/nope');
  await expect(page.locator('.l-es')).toBeHidden();
});

test('/es/nope → Spanish 404', async ({ page }) => {
  const res = await page.goto('/es/nope');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.l-es h1')).toHaveText('Esta lámina no está en el juego.');
  await expect(page.locator('.l-en')).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('falls back to English', async ({ page }) => {
    await page.goto('/es/nope');
    await expect(page.locator('.l-en h1')).toBeVisible();
  });
});
