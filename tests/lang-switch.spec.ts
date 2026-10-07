import { test, expect } from '@playwright/test';

test('EN services links to ES servicios and remembers the choice', async ({ page }) => {
  await page.goto('/en/services');
  const es = page.locator('header .tools .lang-switch a[hreflang="es"]');
  await expect(es).toHaveAttribute('href', '/es/servicios');
  await expect(page.locator('header .tools .lang-switch [aria-current="true"]')).toHaveText('EN');
  await es.click();
  await expect(page).toHaveURL(/\/es\/servicios\/?$/);
  expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('es');
});
