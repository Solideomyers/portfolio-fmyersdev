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
