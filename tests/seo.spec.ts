import { test, expect } from '@playwright/test';

test('sitemap.xml lists indexable pages with alternates', async ({ page, request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  await page.goto('/en');
  const r = await page.evaluate((s) => {
    const d = new DOMParser().parseFromString(s, 'application/xml');
    const locs = [...d.getElementsByTagName('loc')].map((l) => l.textContent);
    const churchapp = [...d.getElementsByTagName('url')].find(
      (u) =>
        u.getElementsByTagName('loc')[0].textContent === 'https://fmyers.dev/en/work/churchapp',
    );
    return {
      error: d.getElementsByTagName('parsererror').length > 0,
      locs,
      alternates: churchapp ? churchapp.getElementsByTagName('xhtml:link').length : -1,
    };
  }, xml);
  expect(r.error).toBe(false);
  for (const u of [
    '/en',
    '/es',
    '/es/proyectos/churchapp',
    '/en/notes',
    '/es/notas/especificacion-de-una-pagina',
  ])
    expect(r.locs).toContain(`https://fmyers.dev${u}`);
  for (const u of ['/ds', '/en/contact/sent', '/es/contacto/enviado', '/404'])
    expect(r.locs).not.toContain(`https://fmyers.dev${u}`);
  expect(r.alternates).toBe(3);
});

test('robots.txt allows the site and points at the sitemap', async ({ request }) => {
  const text = await (await request.get('/robots.txt')).text();
  expect(text).toContain('User-agent: *');
  expect(text).toContain('Disallow: /ds');
  expect(text).toContain('Sitemap: https://fmyers.dev/sitemap.xml');
});

for (const p of [
  { url: '/en', type: 'website', image: /\/og\/site\/en\.png$/ },
  { url: '/es/servicios', type: 'website', image: /\/og\/site\/es\.png$/ },
  { url: '/en/work/churchapp', type: 'article', image: /\/og\/site\/en\.png$/ },
  {
    url: '/es/notas/especificacion-de-una-pagina',
    type: 'article',
    image: /\/og\/notes\/es\/.+\.png$/,
  },
]) {
  test(`${p.url}: complete social meta`, async ({ page }) => {
    await page.goto(p.url);
    const meta = (prop: string) => page.locator(`meta[property="${prop}"]`).getAttribute('content');
    expect(await meta('og:title')).toBe(await page.title());
    expect(await meta('og:url')).toBe(
      await page.locator('link[rel="canonical"]').getAttribute('href'),
    );
    expect(await meta('og:type')).toBe(p.type);
    expect(await meta('og:site_name')).toBe('fmyers.dev');
    expect(await meta('og:description')).toBeTruthy();
    expect(await meta('og:locale')).toMatch(/^(en_US|es_ES)$/);
    expect(await meta('og:image')).toMatch(p.image);
    expect(await meta('og:image')).toMatch(/^https:\/\//);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  });
}

for (const lang of ['en', 'es']) {
  test(`/og/site/${lang}.png is a 1200×630 PNG`, async ({ request }) => {
    const res = await request.get(`/og/site/${lang}.png`);
    expect(res.headers()['content-type']).toBe('image/png');
    const b = await res.body();
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  });
}

test('no analytics script outside production', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('script[src*="/_vercel/insights/"]')).toHaveCount(0);
});

test.describe('Lighthouse findings', () => {
  for (const url of [
    '/en',
    '/es',
    '/en/work',
    '/es/proyectos',
    '/en/about',
    '/es/servicios',
    '/en/pricing',
    '/en/contact',
    '/es/privacidad',
    '/en/notes',
  ]) {
    test(`${url} has a meta description`, async ({ page }) => {
      await page.goto(url);
      expect(
        (await page.locator('meta[name="description"]').getAttribute('content'))?.length ?? 0,
      ).toBeGreaterThan(40);
    });
  }

  test('the Turnstile slot is a labelled group (aria-label needs a role)', async ({ page }) => {
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    await page.goto('/en/contact');
    await expect(page.locator('.cf-turnstile')).toHaveAttribute('role', 'group');
  });

  test('links inside running text are underlined, not colour-only', async ({ page }) => {
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    await page.goto('/en/contact');
    await expect(page.locator('.note a')).toHaveCSS('text-decoration-line', 'underline');
    await page.goto('/en/notes/one-page-spec');
    await expect(page.locator('.prose p a').first()).toHaveCSS('text-decoration-line', 'underline');
  });

  test('fonts are self-hosted and preloaded (no render-blocking third-party CSS)', async ({
    page,
  }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url());
    });
    await page.goto('/en');
    expect(external).toEqual([]);
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(2);
    expect(await page.evaluate(() => document.fonts.check('700 16px Archivo'))).toBe(true);
  });
});

test('the work index loads its first card image eagerly with high priority (LCP)', async ({
  page,
}) => {
  await page.goto('/en/work');
  const imgs = page.locator('a.card.grid figure img');
  await expect(imgs.first()).toHaveAttribute('loading', 'eager');
  await expect(imgs.first()).toHaveAttribute('fetchpriority', 'high');
  // The rest stay lazy (ChurchApp has no screenshot yet: SP8b asset).
  for (const img of (await imgs.all()).slice(1))
    await expect(img).toHaveAttribute('loading', 'lazy');
});
