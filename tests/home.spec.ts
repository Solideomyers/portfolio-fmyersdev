import { test, expect } from '@playwright/test';
import { availability } from '../src/lib/home';
import { site } from '../src/config/site';

// The availability sentence is rendered at build time from site.availableFrom and the real date,
// so expectations are computed the same way (a build after the month must not turn CI red).
const built = (lang: 'en' | 'es') => availability(site.availableFrom, new Date(), lang);

const homes = [
  {
    lang: 'en',
    url: '/en',
    work: '/en/work',
    pricing: '/en/pricing',
    now: 'Available for new projects',
  },
  {
    lang: 'es',
    url: '/es',
    work: '/es/proyectos',
    pricing: '/es/precios',
    now: 'Disponible para nuevos proyectos',
  },
] as const;

for (const h of homes) {
  test(`${h.lang} home: hero, work, services, process, contact`, async ({ page }) => {
    // A visitor clock before any plausible date: the inline script must leave the build text alone.
    await page.clock.setFixedTime(new Date('2000-01-01T00:00:00Z'));
    await page.goto(h.url);
    await expect(page.locator('.hero .ruler .zone')).toHaveCount(8);
    await expect(page.locator('.hero .ruler .zone.on')).toHaveText('1');
    await expect(page.locator('.hero .available .text')).toHaveText(built(h.lang).text);
    await expect(page.locator('.hero .spec-grid.rows .cell')).toHaveCount(4);
    await expect(page.locator('.hero .v.accent')).toHaveText('Next.js · NestJS · PostgreSQL');
    const cards = page.locator('a.card.grid');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).locator('.id')).toHaveText('FM-01');
    await expect(cards.nth(1).locator('.id')).toHaveText('FM-02');
    await expect(page.locator('.work-head a')).toHaveAttribute('href', h.work);
    await expect(page.locator('.services-head a')).toHaveAttribute('href', h.pricing);
    await expect(page.locator('.package-card.compact')).toHaveCount(3);
    await expect(page.locator('.package-card.compact.featured .c-amount')).toHaveText('$4,500');
    await expect(page.locator('.package-card.compact .c-teaser li')).toHaveCount(9);
    await expect(page.locator('.process-grid .cell')).toHaveCount(4);
    await expect(page.locator('.contact-block a[href^="https://wa.me/"]')).toHaveCount(1);
    await expect(page.locator('.contact-block a[href^="mailto:"]')).toHaveCount(1);
  });

  test(`${h.lang} home: availability is dateless once the month has started (visitor clock)`, async ({
    page,
  }) => {
    test.skip(!built(h.lang).dated, 'build already past availableFrom: no script to exercise');
    await page.clock.setFixedTime(new Date('2099-01-01T00:00:00Z'));
    await page.goto(h.url);
    await expect(page.locator('.hero .available .text')).toHaveText(h.now);
  });
}

test('contact block stays inverted and readable in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en');
  const block = page.locator('.contact-block');
  // dark: invert-bg = ink #E9EBE6, invert-fg = paper #0E1114
  await expect(block).toHaveCSS('background-color', 'rgb(233, 235, 230)');
  await expect(block).toHaveCSS('color', 'rgb(14, 17, 20)');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('availability shows the build-time sentence', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('.hero .available .text')).toHaveText(built('en').text);
  });
});

test('home heading levels never skip', async ({ page }) => {
  await page.goto('/en');
  const levels = await page
    .locator('main :is(h1, h2, h3, h4)')
    .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
});

test('home contact and section links meet the 44px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/en');
  const heights = await page
    .locator('.contact-block .links a, .meta-link')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(heights).toHaveLength(5); // e2e builds with BLOG_ENABLED=true: + ALL NOTES →
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
});
