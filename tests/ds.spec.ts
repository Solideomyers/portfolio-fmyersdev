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

// Rendered gap between the glyph and the label (textContent keeps the space even when layout trims it).
const glyphGap = (el: Element, side: string) => {
  const glyph = el.querySelector('.glyph')!;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (!glyph.contains(t) && t.data.trim()) texts.push(t);
  }
  const range = document.createRange();
  range.selectNodeContents(texts[0]);
  const g = glyph.getBoundingClientRect();
  const t = range.getBoundingClientRect();
  return side === 'before' ? t.left - g.right : g.left - t.right;
};

test('button glyphs keep a visible space, also inside flex layouts', async ({ page }) => {
  await page.goto('/en/work/chapel');
  expect(await page.locator('.head .btn.link').evaluate(glyphGap, 'before')).toBeGreaterThanOrEqual(
    4,
  );
  expect(await page.locator('.cta-row .btn').evaluate(glyphGap, 'after')).toBeGreaterThanOrEqual(4);
});

test('/ds has the SP3 specimens', async ({ page }) => {
  await page.goto('/ds');
  for (const id of ['package-card', 'faq', 'compare', 'button-secondary']) {
    await expect(page.locator(`#${id}`), id).toBeVisible();
  }
  await expect(page.locator('#package-card .package-card.featured .corner')).toHaveCount(1);
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
});

test('/ds has the SP4 specimens', async ({ page }) => {
  await page.goto('/ds');
  for (const id of [
    'hero',
    'package-compact',
    'process-grid',
    'contact-block',
    'timeline',
    'portrait',
    'spec-rows',
  ]) {
    await expect(page.locator(`#${id}`), id).toBeVisible();
  }
  await expect(page.locator('#hero .ruler .zone')).toHaveCount(8);
  await expect(page.locator('#spec-rows .spec-grid.rows .cell')).toHaveCount(4);
  await expect(page.locator('#portrait .hatch')).toContainText('PORTRAIT');
});
