import { test, expect } from '@playwright/test';

test.describe('Spanish browser', () => {
  test.use({ locale: 'es-VE' });
  test('goes to /es', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/es\/?$/);
  });
});

test.describe('English browser', () => {
  test.use({ locale: 'en-US' });
  test('goes to /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/?$/);
  });
  test('a stored choice wins over the browser', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lang', 'es'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/es\/?$/);
  });
  test('a garbage stored value is ignored', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lang', 'fr'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, locale: 'es-VE' });
  test('meta refresh goes to /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});
