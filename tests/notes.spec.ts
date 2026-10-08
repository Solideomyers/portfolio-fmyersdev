import { test, expect } from '@playwright/test';

const idx = [
  {
    lang: 'en',
    url: '/en/notes',
    sheet: 'SHEET 07 — NOTES',
    h1: 'Notes',
    rss: '/en/notes/rss.xml',
    all: 'All',
    empty: 'Automation',
    note: '/en/notes/one-page-spec',
    foot: 'PROCESS · 6 MIN',
  },
  {
    lang: 'es',
    url: '/es/notas',
    sheet: 'LÁMINA 07 — NOTAS',
    h1: 'Notas',
    rss: '/es/notas/rss.xml',
    all: 'Todo',
    empty: 'Automatización',
    note: '/es/notas/especificacion-de-una-pagina',
    foot: 'PROCESO · 6 MIN',
  },
] as const;

for (const p of idx) {
  test(`${p.url}: header, rss, chips and rows`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('.notes-head .sheet-header')).toContainText(p.sheet);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page.locator('.notes-head a', { hasText: 'RSS ↗' })).toHaveAttribute(
      'href',
      p.rss,
    );
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      'href',
      `https://fmyers.dev${p.rss}`, // feeds are advertised with absolute URLs
    );
    const chips = page.locator('.notes-chips button');
    await expect(chips).toHaveCount(5);
    await expect(chips.nth(0)).toHaveText(new RegExp(`^${p.all}\\s*1$`));
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.note-row')).toHaveCount(1);
    await expect(page.locator('.note-row').first()).toHaveAttribute('href', p.note);
    await expect(page.locator('.note-row .foot')).toHaveText(
      new RegExp(p.foot.replace(' · ', '\\s*·\\s*')),
    ); // flex gap, no text spaces
  });

  test(`${p.url}: an empty category shows the empty state; show all restores`, async ({ page }) => {
    await page.goto(p.url);
    await page.locator('.notes-chips button', { hasText: p.empty }).click();
    await expect(page.locator('.note-row').first()).toBeHidden();
    await expect(page.locator('.notes-empty')).toBeVisible();
    await page.locator('.notes-empty button').click();
    await expect(page.locator('.note-row').first()).toBeVisible();
    await expect(page.locator('.notes-chips button').nth(0)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test.describe('notes index without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every row shows, nothing is pressed, no empty state', async ({ page }) => {
    await page.goto('/en/notes');
    await expect(page.locator('.note-row')).toHaveCount(1);
    await expect(page.locator('.notes-chips [aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.notes-empty')).toBeHidden();
  });
});

const notes = [
  {
    url: '/en/notes/one-page-spec',
    head: 'N-02 — PROCESS',
    meta: '2026.11 · 6 MIN',
    h1: 'Why every project starts with a one-page spec',
    dek: 'A day of writing saves weeks of rework. What goes on the page, and what I leave out.',
    tags: ['Process', 'Pricing', 'Specs'],
    twin: '/es/notas/especificacion-de-una-pagina',
    contact: '/en/contact',
    write: 'WRITE TO ME',
  },
  {
    url: '/es/notas/especificacion-de-una-pagina',
    head: 'N-02 — PROCESO',
    meta: '2026.11 · 6 MIN',
    h1: 'Por qué todo proyecto empieza con una especificación de una página',
    dek: 'Un día escribiendo ahorra semanas de retrabajo. Qué va en la página y qué dejo fuera.',
    tags: ['Proceso', 'Precios', 'Especificación'],
    twin: '/en/notes/one-page-spec',
    contact: '/es/contacto',
    write: 'ESCRÍBEME',
  },
] as const;

for (const n of notes) {
  test(`${n.url}: header, toc, body, author, twin, og`, async ({ page }) => {
    await page.goto(n.url);
    await expect(page.locator('.note-head .sheet-header')).toContainText(n.head);
    await expect(page.locator('.note-head .sheet-header')).toContainText(n.meta);
    await expect(page.locator('h1')).toHaveText(n.h1);
    await expect(page.locator('.note-head .dek')).toHaveText(n.dek);
    await expect(page.locator('.note-head .tag')).toHaveText([...n.tags]);
    const h2 = page.locator('.prose h2');
    await expect(h2).toHaveCount(4);
    await expect(page.locator('.toc-side a[href^="#"]')).toHaveCount(4);
    expect(await h2.first().evaluate((e) => getComputedStyle(e, '::before').content)).toBe('none');
    await expect(page.locator('.prose pre')).not.toHaveAttribute('style', /background/);
    await expect(page.locator('.prose .figure')).toContainText(/1600×1000/);
    await expect(page.locator('.author a')).toHaveAttribute('href', n.contact);
    await expect(page.locator('.author a')).toContainText(n.write);
    await expect(page.locator('.related')).toHaveCount(0); // a single published note: nothing to relate
    await expect(page.locator('header .tools .lang-switch a[hreflang]')).toHaveAttribute(
      'href',
      n.twin,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/fmyers\.dev\/og\/notes\/(en|es)\/[a-z-]+\.png$/,
    );
    await expect(page.locator('header nav a[aria-current="page"]')).toContainText(/NOTES|NOTAS/);
  });
}

test('drafts are never routed', async ({ request }) => {
  expect((await request.get('/en/notes/apps-script-backend')).status()).toBe(404);
  expect((await request.get('/es/notas/apps-script-como-backend')).status()).toBe(404);
});

for (const f of [
  {
    url: '/en/notes/rss.xml',
    link: 'https://fmyers.dev/en/notes/one-page-spec',
    title: 'fmyers.dev — Notes',
  },
  {
    url: '/es/notas/rss.xml',
    link: 'https://fmyers.dev/es/notas/especificacion-de-una-pagina',
    title: 'fmyers.dev — Notas',
  },
]) {
  test(`${f.url} is a valid feed with the published notes only`, async ({ page, request }) => {
    const res = await request.get(f.url);
    expect(res.status()).toBe(200);
    const text = await res.text();
    await page.goto('/en');
    const parsed = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      return {
        error: doc.querySelector('parsererror') !== null,
        title: doc.querySelector('channel > title')?.textContent,
        links: [...doc.querySelectorAll('item > link')].map((l) => l.textContent),
      };
    }, text);
    expect(parsed).toEqual({ error: false, title: f.title, links: [f.link] });
  });
}

for (const url of [
  '/og/notes/en/one-page-spec.png',
  '/og/notes/es/especificacion-de-una-pagina.png',
]) {
  test(`${url} is a 1200×630 PNG`, async ({ request }) => {
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('image/png');
    const b = await res.body();
    expect([...b.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  });
}
test('drafts get no OG image', async ({ request }) => {
  expect((await request.get('/og/notes/en/apps-script-backend.png')).status()).toBe(404);
});
