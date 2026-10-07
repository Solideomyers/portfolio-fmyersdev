import { test, expect } from '@playwright/test';

const ids = [
  'status',
  'tag',
  'button',
  'sheet-header',
  'spec-grid',
  'figure',
  'metrics',
  'post-row',
  'project-card',
  'cta-row',
];

test('/ds renders every SP2 specimen and is noindex', async ({ page }) => {
  const res = await page.goto('/ds');
  expect(res?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  for (const id of ids) await expect(page.locator(`#${id}`), id).toBeVisible();
});

test('status variants: filled, ring, dashed — always with a label', async ({ page }) => {
  await page.goto('/ds');
  const dots = page.locator('#status .dot');
  await expect(dots).toHaveCount(3);
  const styles = await dots.evaluateAll((els) =>
    els.map((e) => {
      const s = getComputedStyle(e);
      return [s.backgroundColor !== 'rgba(0, 0, 0, 0)', s.borderTopStyle];
    }),
  );
  expect(styles).toEqual([
    [true, 'solid'],
    [false, 'solid'],
    [false, 'dashed'],
  ]);
  for (const label of ['LIVE', 'IN USE', 'PILOT']) {
    await expect(page.locator('#status')).toContainText(label);
  }
});

test('figure: real image when the file exists, hatch otherwise', async ({ page }) => {
  await page.goto('/ds');
  await expect(page.locator('#figure img')).toHaveCount(1);
  await expect(page.locator('#figure .hatch')).toContainText('SCREENSHOT');
  await expect(page.locator('#figure figcaption').first()).toContainText('FIG. 1');
});

test('spec grid omits empty values', async ({ page }) => {
  await page.goto('/ds');
  await expect(page.locator('#spec-grid .cell')).toHaveCount(3);
});
