import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/i18n/routes';

const widths = [375, 768, 1199, 1200, 1280];

const extra = [
  '/en/work/chapel',
  '/en/work/churchapp',
  '/es/proyectos/chapel',
  '/es/proyectos/churchapp',
  '/ds',
];
for (const url of [...Object.values(ROUTES).flatMap((r) => [r.en, r.es]), ...extra]) {
  test(`no horizontal overflow on ${url}`, async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, `${url} @${width}`).toBeLessThanOrEqual(width);
    }
  });
}
