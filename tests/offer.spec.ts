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
