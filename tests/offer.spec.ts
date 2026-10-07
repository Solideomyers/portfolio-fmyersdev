import { test, expect } from '@playwright/test';

const services = [
  {
    lang: 'en',
    url: '/en/services',
    pricing: '/en/pricing',
    contact: '/en/contact',
    monthly: '$2,800 / mo',
  },
  {
    lang: 'es',
    url: '/es/servicios',
    pricing: '/es/precios',
    contact: '/es/contacto',
    monthly: '$2,800 / mes',
  },
] as const;

for (const s of services) {
  test(`${s.lang} services: sheets, process, faq, cta`, async ({ page }) => {
    await page.goto(s.url);
    const sheets = page.locator('.service-sheet');
    await expect(sheets).toHaveCount(3);
    await expect(page.locator('.service-sheet.featured')).toHaveCount(1);
    await expect(page.locator('.service-sheet.featured .corner')).toHaveCount(1);
    await expect(page.locator('.service-sheet.featured .badge-common')).toHaveCount(1);
    await expect(sheets.nth(2).locator('.price')).toHaveText(s.monthly);
    await expect(sheets.first().locator('.see')).toHaveAttribute('href', s.pricing);
    await expect(page.locator('.process-row')).toHaveCount(4);
    await expect(page.locator('.faq .count')).toHaveText('FAQ · 04');
    await expect(page.locator('.faq details')).toHaveCount(4);
    await expect(page.locator('.faq .qid').first()).toHaveText('Q-07');
    await expect(page.locator('.cta-row a.secondary')).toHaveAttribute('href', s.pricing);
    await expect(page.locator('.cta-row a.primary')).toHaveAttribute('href', s.contact);
  });
}

const pricing = [
  { lang: 'en', url: '/en/pricing', unit: 'PER MONTH', faqFirst: 'Q-01' },
  { lang: 'es', url: '/es/precios', unit: 'AL MES', faqFirst: 'Q-01' },
] as const;

for (const p of pricing) {
  test(`${p.lang} pricing: packages, compare, faq, json-ld`, async ({ page }) => {
    await page.goto(p.url);
    const cards = page.locator('.package-card');
    await expect(cards).toHaveCount(3);
    const featured = page.locator('.package-card.featured');
    await expect(featured).toHaveCount(1);
    await expect(featured.locator('.corner')).toHaveCount(1);
    await expect(featured.locator('.amount')).toHaveText('$4,500');
    await expect(cards.nth(2).locator('.price')).toContainText(p.unit);
    await expect(page.locator('.compare .row')).toHaveCount(8);
    await expect(page.locator('.compare .val')).toHaveCount(21);
    await expect(page.locator('.faq .count')).toHaveText('FAQ · 06');
    const details = page.locator('.faq details');
    await expect(details.first()).toHaveAttribute('open', '');
    await details.nth(1).locator('summary').click();
    await expect(details.nth(1)).toHaveAttribute('open', '');
    await expect(details.first()).toHaveAttribute('open', '');
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '',
    );
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(6);
  });
}

test('compare table scrolls inside its region at 375 with SWIPE visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/en/pricing');
  await expect(page.locator('.compare .swipe')).toBeVisible();
  const scroll = page.locator('.compare-scroll');
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('SWIPE hint is hidden on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/pricing');
  await expect(page.locator('.compare .swipe')).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('FAQ toggles natively', async ({ page }) => {
    await page.goto('/en/pricing');
    const second = page.locator('.faq details').nth(1);
    await expect(second).not.toHaveAttribute('open', '');
    await second.locator('summary').click();
    await expect(second).toHaveAttribute('open', '');
  });
});
