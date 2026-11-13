# SP9 Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A catalogue of ready-made products, hidden behind `PRODUCTS_ENABLED`. Install products are requested through the existing contact form with the product preselected. Download products link to an external hosted checkout.

**Architecture:**

- A new `products` content collection with a schema discriminated on `kind`.
- Pure helpers in `src/lib/products.ts`.
- Index and product pages that render only when the flag is on, mirroring the blog (`src/config/blog.ts`, `[notes].astro`, `check-blog-hidden.mjs`).
- The contact pipeline gains one optional, validated `product` field, end to end: form → `/api/contact` → Apps Script sheet and emails.

**Tech Stack:** Astro 7 static output, `astro:env`, content collections (zod), vanilla TS `<script>`, Playwright (`--workers=1` locally), Apps Script (`.gs`, tested through `node:vm`).

**Spec:** `docs/superpowers/specs/2026-10-13-sp9-products-design.md`

## Global Constraints

- No new dependencies.
- Components read semantic tokens only. Radius 0, no shadows, no emoji. Glyphs only: → ↗ ← — · ◐ + ✓. 44px touch targets, 4.5:1 contrast.
- `src/styles/tokens/*.css`, `src/styles/motion.css` and `docs/handoff/` are never edited.
- URLs are written only in `src/i18n/routes.ts` (`ROUTES`).
- Flag off (the default) means **nothing** of the catalogue is in the build: no routes, OG images, nav item, sitemap entries, entry links or `data-products`. Enforced by `scripts/check-products-hidden.mjs` in CI.
- Product ids match `^PR-\d{2}$`. Every product exists in EN and ES with the same `id`, `kind` and `from`.
- Sheet header: "SHEET 09 — PRODUCTS" / "LÁMINA 09 — PRODUCTOS".
- Nav order when both flags are on: 01 SERVICES … 05 CONTACT, 06 PRODUCTS, 07 NOTES. Existing numbers never shift.
- Commit scopes from `scripts/scopes.cjs`: `content`, `pages`, `ui`, `i18n`, `contact`, `config`, `ci`, `docs`.

## Review Focus

1. A shared link with `?product=` pointing to an unknown, draft or malformed id must leave the form exactly as without the parameter: no line, an empty hidden field, no console error. Pinned in Task 6.
2. The same is true with the flag off: `?product=PR-01` on a production build must not show anything, because there is no `data-products`. Pinned by the Task 1 guard (`data-products=` is a leak).
3. "Remove", then submitting, must not send the product. Pinned in Task 6.
4. An Apps Script row from before this change must keep its columns, with `product` appended last. A crafted `product` (formula, long string) must never reach the sheet unvalidated. Pinned in Task 7.
5. When both flags are on, the nav must not overflow at 1024 and 1280. Pinned in Task 8.

---

### Task 1: Flag, guard and CI

**Files:**

- Modify: `astro.config.mjs` (env schema)
- Create: `src/config/products.ts`, `scripts/check-products-hidden.mjs`
- Modify: `playwright.config.ts` (webServer env), `.github/workflows/ci.yml` (build job)
- Test: `tests/products-hidden.spec.ts`

**Interfaces:**

- Produces: `productsEnabled: boolean` from `src/config/products.ts`; CLI `node scripts/check-products-hidden.mjs [dir]`, which exits 1 on any leak.

- [ ] **Step 1: Write the failing test** `tests/products-hidden.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (dir: string) => {
  try {
    execFileSync('node', ['scripts/check-products-hidden.mjs', dir], { stdio: 'pipe' });
    return 0;
  } catch (e) {
    return (e as { status: number }).status;
  }
};
const site = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'products-hidden-'));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(join(dir, p, '..'), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
};

test('passes on a build without the catalogue', () => {
  expect(run(site({ 'en/index.html': '<a href="/en/work">w</a>' }))).toBe(0);
});
test('fails on a product page, an OG image or a link, on any host', () => {
  expect(run(site({ 'en/products/index.html': '' }))).toBe(1);
  expect(run(site({ 'es/productos/kit/index.html': '' }))).toBe(1);
  expect(run(site({ 'og/products/en/kit.png': '' }))).toBe(1);
  expect(run(site({ 'en/services/index.html': '<a href="/en/products">p</a>' }))).toBe(1);
  expect(
    run(site({ 'sitemap.xml': '<loc>https://fmyers-dev.vercel.app/es/productos/kit</loc>' })),
  ).toBe(1);
  expect(run(site({ 'en/contact/index.html': '<form data-products=\'{"PR-01":"x"}\'>' }))).toBe(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --workers=1 tests/products-hidden.spec.ts`
Expected: FAIL (the script does not exist, so the exit status is not 0 or 1 as expected).

- [ ] **Step 3: Implement**

`astro.config.mjs`, next to `BLOG_ENABLED` in `env.schema`:

```js
      PRODUCTS_ENABLED: envField.boolean({ context: 'server', access: 'public', default: false }),
```

`src/config/products.ts`:

```ts
import { PRODUCTS_ENABLED } from 'astro:env/server';

// Like src/config/blog.ts: turn the catalogue on with PRODUCTS_ENABLED=true (Vercel env) and a redeploy.
export const productsEnabled = PRODUCTS_ENABLED;
```

`scripts/check-products-hidden.mjs`:

```js
// CI: the default build (PRODUCTS_ENABLED unset) must neither contain nor link the catalogue.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? '.vercel/output/static';
const PAGE = /^\/(en\/products|es\/productos|og\/products)(\/|$)/;
const ATTR =
  /(?:href|src|content)=["'](?:https?:\/\/[^/"'\s]+)?\/(?:en\/products|es\/productos|og\/products)(?:["'/?#])/;
const URL_TEXT =
  /https?:\/\/[^/"'\s<]+\/(?:en\/products|es\/productos|og\/products)(?:[/"'<?#\s]|$)/;
const DATA = /data-products=/;
const SCANNED = /\.(html|xml|json|txt|webmanifest)$/;
const found = [];

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    const rel = '/' + relative(root, full).split(sep).join('/');
    if (PAGE.test(rel)) {
      found.push(rel);
      continue;
    }
    if (e.isDirectory()) await walk(full);
    else if (SCANNED.test(e.name)) {
      const text = await readFile(full, 'utf8');
      if (ATTR.test(text) || URL_TEXT.test(text) || DATA.test(text))
        found.push(`${rel} references the catalogue`);
    }
  }
}

await walk(root);
if (found.length) {
  console.error(
    `The catalogue is off (PRODUCTS_ENABLED=false) but the build contains:\n${found.join('\n')}`,
  );
  process.exit(1);
}
console.log('products hidden: ok');
```

`playwright.config.ts`, `webServer.env`: `{ BLOG_ENABLED: 'true', PRODUCTS_ENABLED: 'true' }`.

`.github/workflows/ci.yml`, build job, after the `check-blog-hidden.mjs` step:

```yaml
- run: node scripts/check-products-hidden.mjs
```

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/products-hidden.spec.ts && npm run build && node scripts/check-products-hidden.mjs`
Expected: PASS, then `products hidden: ok`.

- [ ] **Step 5: Commit** `feat(config): add the products flag and its ci guard`

### Task 2: Collection, helpers and starter content

**Files:**

- Modify: `src/content.config.ts`
- Create: `src/lib/products.ts`
- Create: `src/content/products/en/pr-01-membership-kit.md`, `src/content/products/es/pr-01-membership-kit.md`, `src/content/products/en/pr-02-workspace-starter.md`, `src/content/products/es/pr-02-workspace-starter.md`
- Test: `tests/products-unit.spec.ts`, `tests/products-content.spec.ts`

**Interfaces:**

- Produces (from `src/lib/products.ts`):
  - `type Kind = 'install' | 'download'`
  - `interface ProductLike { data: { id: string; slug: string; lang: Lang; kind: Kind; order: number; draft: boolean } }`
  - `productUrl(lang: Lang, slug: string): string`, which gives `${ROUTES.products[lang]}/${slug}`
  - `listProducts<T extends ProductLike>(all: T[], lang: Lang): { install: T[]; download: T[] }`: non-drafts in `lang`, sorted by `order` then id
  - `productPaths<T extends ProductLike>(all: T[], lang: Lang)`, which returns `{ params: { slug }, props: { entry } }[]`; non-drafts only; throws on a duplicate slug
  - `twinProduct<T extends ProductLike>(all: T[], entry: T): T | undefined`
  - `productTitles(all: ProductLike & { data: { title: string } }[], lang: Lang): Record<string, string>`, mapping id to title for non-drafts in `lang`
- Consumes: `ROUTES.products`, added in Task 3. In this task, add the `products` key to `ROUTES` already (it is only data; Task 3 wires the nav).

- [ ] **Step 1: Write the failing tests**

`tests/products-unit.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  listProducts,
  productPaths,
  productTitles,
  productUrl,
  twinProduct,
} from '../src/lib/products';

const p = (
  id: string,
  lang: 'en' | 'es',
  kind: 'install' | 'download',
  order = 99,
  draft = false,
  slug = id.toLowerCase(),
) => ({
  data: { id, slug, lang, kind, order, draft, title: `${id} ${lang}` },
});
const all = [
  p('PR-02', 'en', 'download', 1),
  p('PR-01', 'en', 'install', 2),
  p('PR-03', 'en', 'install', 1),
  p('PR-04', 'en', 'install', 0, true),
  p('PR-01', 'es', 'install', 2),
];

test('urls follow ROUTES', () => {
  expect(productUrl('en', 'kit')).toBe('/en/products/kit');
  expect(productUrl('es', 'kit')).toBe('/es/productos/kit');
});
test('lists by kind, own language, no drafts, by order then id', () => {
  const l = listProducts(all, 'en');
  expect(l.install.map((e) => e.data.id)).toEqual(['PR-03', 'PR-01']);
  expect(l.download.map((e) => e.data.id)).toEqual(['PR-02']);
});
test('paths skip drafts and reject duplicate slugs', () => {
  expect(productPaths(all, 'en').map((x) => x.params.slug)).toEqual(['pr-02', 'pr-01', 'pr-03']);
  expect(() =>
    productPaths(
      [p('PR-01', 'en', 'install'), p('PR-02', 'en', 'install', 1, false, 'pr-01')],
      'en',
    ),
  ).toThrow(/Duplicate product slug/);
});
test('twin and titles', () => {
  expect(twinProduct(all, all[1])?.data.lang).toBe('es');
  expect(productTitles(all, 'en')).toEqual({
    'PR-02': 'PR-02 en',
    'PR-01': 'PR-01 en',
    'PR-03': 'PR-03 en',
  });
});
```

`tests/products-content.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const fm = (path: string) => {
  const text = readFileSync(path, 'utf8');
  const get = (k: string) => text.match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1].trim();
  return { id: get('id'), kind: get('kind'), from: get('from'), checkout: get('checkoutUrl') };
};
const dir = (l: string) =>
  readdirSync(`src/content/products/${l}`).map((f) => fm(`src/content/products/${l}/${f}`));

test('every product exists in EN and ES with the same id, kind and price', () => {
  const key = (x: ReturnType<typeof fm>) => `${x.id}|${x.kind}|${x.from}`;
  expect(dir('es').map(key).sort()).toEqual(dir('en').map(key).sort());
  for (const x of dir('en')) expect(x.id).toMatch(/^PR-\d{2}$/);
});
test('only download products carry a checkout URL', () => {
  for (const x of [...dir('en'), ...dir('es')])
    expect(Boolean(x.checkout), x.id).toBe(x.kind === 'download');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --workers=1 tests/products-unit.spec.ts tests/products-content.spec.ts`
Expected: FAIL (module and folder missing).

- [ ] **Step 3: Implement**

`src/i18n/routes.ts`, inside `ROUTES` after `notes`:

```ts
  products: { en: '/en/products', es: '/es/productos' },
```

`src/content.config.ts`, before `export const collections`:

```ts
const shot = z.object({ src: z.string(), alt: z.string(), caption: z.string() }).strict();
const productBase = {
  id: z.string().regex(/^PR-\d{2}$/),
  slug: z.string(),
  lang: z.enum(['en', 'es']),
  title: z.string(),
  summary: z.string(),
  from: z.number().int().positive(),
  includes: z.array(z.string()).min(1),
  stack: z.array(z.string()),
  case: z
    .string()
    .regex(/^FM-\d{2}$/)
    .optional(),
  cover: z.object({ src: z.string(), alt: z.string() }),
  shots: z.array(shot).default([]),
  order: z.number().default(99),
  draft: z.boolean().default(false),
};
const products = defineCollection({
  // Id from the file path (en/pr-01-…): EN and ES twins share `id`, not the entry id.
  loader: glob({
    base: './src/content/products',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  // strict: an install product with checkoutUrl (or a download one with delivery) fails the build.
  schema: z.discriminatedUnion('kind', [
    z.object({ ...productBase, kind: z.literal('install'), delivery: z.string() }).strict(),
    z
      .object({
        ...productBase,
        kind: z.literal('download'),
        format: z.string(),
        checkoutUrl: z.url().startsWith('https://'),
        provider: z.string(),
      })
      .strict(),
  ]),
});
```

and add `products` to `collections`.

`src/lib/products.ts`:

```ts
import { ROUTES, type Lang } from '../i18n/routes';

export type Kind = 'install' | 'download';
export interface ProductLike {
  data: { id: string; slug: string; lang: Lang; kind: Kind; order: number; draft: boolean };
}

export const productUrl = (lang: Lang, slug: string) => `${ROUTES.products[lang]}/${slug}`;

const live = <T extends ProductLike>(all: T[], lang: Lang) =>
  all
    .filter((e) => !e.data.draft && e.data.lang === lang)
    .sort((a, b) => a.data.order - b.data.order || a.data.id.localeCompare(b.data.id));

/** Index groups for a language: install first, then download (spec). */
export function listProducts<T extends ProductLike>(all: T[], lang: Lang) {
  const l = live(all, lang);
  return {
    install: l.filter((e) => e.data.kind === 'install'),
    download: l.filter((e) => e.data.kind === 'download'),
  };
}

export function productPaths<T extends ProductLike>(all: T[], lang: Lang) {
  const seen = new Set<string>();
  return all
    .filter((e) => !e.data.draft && e.data.lang === lang)
    .map((entry) => {
      if (seen.has(entry.data.slug))
        throw new Error(
          `Duplicate product slug "${entry.data.slug}" in /${lang} (${entry.data.id})`,
        );
      seen.add(entry.data.slug);
      return { params: { slug: entry.data.slug }, props: { entry } };
    });
}

export const twinProduct = <T extends ProductLike>(all: T[], entry: T) =>
  all.find((e) => e.data.id === entry.data.id && e.data.lang !== entry.data.lang && !e.data.draft);

/** id → title for the contact form's data-products (current language, published only). */
export const productTitles = (all: (ProductLike & { data: { title: string } })[], lang: Lang) =>
  Object.fromEntries(live(all, lang).map((e) => [e.data.id, e.data.title]));
```

Starter content. The copy is written from the shipped cases; the owner rewrites it before enabling the flag. `src/content/products/en/pr-01-membership-kit.md`:

```md
---
id: PR-01
slug: membership-kit
lang: en
title: Church membership kit
summary: The ChurchApp membership system, set up with your church's name, phases and modules.
kind: install
from: 1200
includes:
  - Public application page and progress check
  - Staff panel with candidates, cohorts and attendance
  - Your phases, modules and roles configured
  - Deployed on your domain, with a handover session
stack: [Next.js, TypeScript, Supabase, Vercel]
delivery: 1–2 weeks
case: FM-01
cover: { src: /work/fm-01/churchapp.png, alt: ChurchApp public membership application page }
order: 1
---
```

The ES twin `src/content/products/es/pr-01-membership-kit.md` has the same `id`, `kind`, `from`, `stack`, `case`, `cover.src` and `order`, with:

- `slug: kit-de-membresia`
- `title: Kit de membresía para iglesias`
- `summary: El sistema de membresía de ChurchApp, configurado con el nombre, las fases y los módulos de tu iglesia.`
- `includes`: "Página pública de solicitud y consulta de avance", "Panel del equipo con candidatos, cohortes y asistencia", "Tus fases, módulos y roles configurados", "Desplegado en tu dominio, con una sesión de entrega"
- `delivery: 1–2 semanas`
- `cover.alt: Página pública de solicitud de membresía de ChurchApp`

`src/content/products/en/pr-02-workspace-starter.md`:

```md
---
id: PR-02
slug: workspace-backend-starter
lang: en
title: Apps Script backend starter
summary: A Google Sheets + Apps Script backend for small forms, with HTML email templates and a key-protected endpoint.
kind: download
from: 49
includes:
  - Code.gs and Email.gs, documented
  - Sheet setup, script properties and deployment guide
  - Email templates in English and Spanish
stack: [Apps Script, Google Sheets]
format: Source files · single-project licence
checkoutUrl: https://checkout.example.com/pr-02
provider: Lemon Squeezy
cover: { src: /products/pr-02/cover.png, alt: Apps Script editor with the starter's files }
order: 2
---
```

The ES twin, `slug: starter-backend-apps-script`, has the translated title, summary, includes and format (`Archivos fuente · licencia para un proyecto`), the same `checkoutUrl`, `provider`, `from` and `order`, and `cover.alt: Editor de Apps Script con los archivos del starter`.

The `example.com` checkout and the missing cover file are deliberate placeholders: the cover renders the hatch. Task 9 opens the launch-checklist issue that replaces them before the flag is enabled.

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/products-unit.spec.ts tests/products-content.spec.ts && npm run check`
Expected: PASS; `astro check` 0 errors.

- [ ] **Step 5: Schema guard (manual RED check)**

Temporarily add `checkoutUrl: https://x.test` to the EN PR-01 file. `npm run build` must fail with a zod error naming `checkoutUrl`. Revert the change.

- [ ] **Step 6: Commit** `feat(content): add the products collection and starter entries`

### Task 3: Navigation and UI strings

**Files:**

- Modify: `src/i18n/routes.ts`, `src/components/SiteNav.astro`, `src/i18n/ui.ts`
- Test: `tests/nav.spec.ts`, `tests/routes-unit.spec.ts`

**Interfaces:**

- Produces:
  - `navKeys({ products, notes }: { products: boolean; notes: boolean }): readonly NavKey[]` in `routes.ts`;
  - `NavKey` now includes `'products'`;
  - `ui[lang].nav.products`, `ui[lang].h1.products`;
  - `ui[lang].products` = `{ sheet, lead, groupInstall, groupDownload, from, request, buy, newTab, noJs, checkoutBy, includes, stack, delivery, format, case, product, remove, view, entry, caseEntry }` (strings below).

- [ ] **Step 1: Write the failing tests**

In `tests/routes-unit.spec.ts` add:

```ts
import { navKeys } from '../src/i18n/routes';
test('nav order: products after contact, notes last; numbers never shift', () => {
  expect(navKeys({ products: false, notes: false })).toEqual([
    'services',
    'work',
    'about',
    'pricing',
    'contact',
  ]);
  expect(navKeys({ products: true, notes: true })).toEqual([
    'services',
    'work',
    'about',
    'pricing',
    'contact',
    'products',
    'notes',
  ]);
  expect(navKeys({ products: false, notes: true }).at(-1)).toBe('notes');
});
```

In `tests/nav.spec.ts`:

- the menu row count becomes `7`, with the comment "e2e builds with both flags on";
- the NOTES assertion becomes `'07'`;
- add a new test:

```ts
test('06 PRODUCTS joins the nav when the catalogue is enabled', async ({ page }) => {
  await page.goto('/es/productos');
  const link = header(page).locator('nav a', { hasText: 'PRODUCTOS' });
  await expect(link).toContainText('06');
  await expect(link).toHaveAttribute('aria-current', 'page');
});
```

(It fails until Task 4 builds the page; Step 2 expects that.)

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --workers=1 tests/routes-unit.spec.ts tests/nav.spec.ts`
Expected: FAIL (`navKeys` missing; counts).

- [ ] **Step 3: Implement**

`src/i18n/routes.ts`: replace `NAV_WITH_NOTES` and the `NavKey` type with:

```ts
/** PRODUCTS (06) and NOTES (07) join the nav only when their flags are on; earlier numbers never shift. */
export const navKeys = ({ products, notes }: { products: boolean; notes: boolean }) => [
  ...NAV,
  ...(products ? (['products'] as const) : []),
  ...(notes ? (['notes'] as const) : []),
];
const ALL_NAV = [...NAV, 'products', 'notes'] as const satisfies readonly RouteKey[];
export type NavKey = (typeof ALL_NAV)[number];
```

In `navKeyOf`, replace `NAV_WITH_NOTES.find(` with `ALL_NAV.find(`. Grep for `NAV_WITH_NOTES` and update every use (`SiteNav.astro`).

`src/components/SiteNav.astro`:

```ts
import { navKeys, path, type Lang, type RouteKey } from '../i18n/routes';
import { productsEnabled } from '../config/products';
// …
const keys = navKeys({ products: productsEnabled, notes: blogEnabled });
```

`src/i18n/ui.ts`: add `products` to the `nav` and `h1` records in both languages, and the `products` block. Add it to the `UI` interface with the same keys, all `string`.

EN:

```ts
nav.products: 'PRODUCTS',
h1.products: 'Products',
products: {
  sheet: 'SHEET 09 — PRODUCTS',
  lead: 'Systems I have already built and run, ready to set up for you or to download. Fixed scope, shorter timelines.',
  groupInstall: 'Installed for you',
  groupDownload: 'Download',
  from: 'FROM',
  request: 'Request this product →',
  buy: 'Buy ↗',
  newTab: '(opens in a new tab)',
  noJs: 'No JavaScript? Mention {id} in your message.',
  checkoutBy: 'Secure checkout and delivery by {provider}.',
  includes: "What's included",
  stack: 'STACK',
  delivery: 'DELIVERY',
  format: 'FORMAT',
  case: 'CASE',
  product: 'Product',
  remove: 'Remove',
  view: 'View product →',
  entry: 'Ready-made products →',
  caseEntry: 'Want one like this? See {id} →',
},
```

ES:

```ts
nav.products: 'PRODUCTOS',
h1.products: 'Productos',
products: {
  sheet: 'LÁMINA 09 — PRODUCTOS',
  lead: 'Sistemas que ya construí y tengo funcionando, listos para instalarlos para ti o para descargar. Alcance fijo, plazos más cortos.',
  groupInstall: 'Lo instalo para ti',
  groupDownload: 'Descarga',
  from: 'DESDE',
  request: 'Solicitar este producto →',
  buy: 'Comprar ↗',
  newTab: '(se abre en una pestaña nueva)',
  noJs: '¿Sin JavaScript? Menciona {id} en tu mensaje.',
  checkoutBy: 'Pago y entrega seguros a través de {provider}.',
  includes: 'Qué incluye',
  stack: 'STACK',
  delivery: 'PLAZO',
  format: 'FORMATO',
  case: 'CASO',
  product: 'Producto',
  remove: 'Quitar',
  view: 'Ver producto →',
  entry: 'Productos listos →',
  caseEntry: '¿Quieres uno así? Ver {id} →',
},
```

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/routes-unit.spec.ts && npm run check`
Expected: PASS, 0 errors. `nav.spec` stays red until Task 4.

- [ ] **Step 5: Commit** `feat(i18n): add the products route, nav entry and copy`

### Task 4: Index page and ProductCard

**Files:**

- Create: `src/components/ProductCard.astro`, `src/components/ProductsIndexPage.astro`, `src/pages/en/[products].astro`, `src/pages/es/[productos].astro`
- Test: `tests/products.spec.ts`

**Interfaces:**

- Consumes: `listProducts`, `productUrl` (Task 2); `ui[lang].products` (Task 3); `productsEnabled` (Task 1); `formatUsd` from `src/lib/offer.ts`; `Figure`, `SheetHeader`, `Tag`.
- Produces: `<ProductCard entry lang eager? />`, root `article.product-card` with `.id`, `.kind`, `.amount`, `a.cta`.

- [ ] **Step 1: Write the failing test** `tests/products.spec.ts`

```ts
import { test, expect } from '@playwright/test';

for (const p of [
  { url: '/en/products', h1: 'Products', groups: ['Installed for you', 'Download'], from: 'FROM' },
  {
    url: '/es/productos',
    h1: 'Productos',
    groups: ['Lo instalo para ti', 'Descarga'],
    from: 'DESDE',
  },
]) {
  test(`${p.url}: sheet, groups in order, cards`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page.locator('.sheet-header')).toContainText(/09/);
    await expect(page.locator('section.group h2')).toHaveText(p.groups);
    const first = page.locator('section.group').first().locator('.product-card').first();
    await expect(first.locator('.id')).toHaveText('PR-01');
    await expect(first.locator('.kind')).toHaveText('INSTALL');
    await expect(first.locator('.from')).toHaveText(p.from);
    await expect(first.locator('.amount')).toHaveText('$1,200');
    await expect(first.locator('a.cta')).toHaveAttribute('href', new RegExp(`^${p.url}/`));
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test --workers=1 tests/products.spec.ts`
Expected: FAIL (404).

- [ ] **Step 3: Implement**

`src/pages/en/[products].astro` (and `es/[productos].astro` with `params: { productos: 'productos' }`, `lang="es"`):

```astro
---
import ProductsIndexPage from '../../components/ProductsIndexPage.astro';
import { productsEnabled } from '../../config/products';

// A one-value param instead of index.astro: a static page would always be built.
export function getStaticPaths() {
  return productsEnabled ? [{ params: { products: 'products' } }] : [];
}
---

<ProductsIndexPage lang="en" />
```

`src/components/ProductsIndexPage.astro`:

- `Base` with `title={`${t.h1.products} — fmyers.dev`}` (match how `WorkIndexPage` builds its title) and `description={t.products.lead}`;
- then `SheetHeader` with `t.products.sheet`, `<h1 class="h1-page">`, `<p class="lead">`;
- then, for each non-empty group in `[['install', groupInstall], ['download', groupDownload]]`, a `<section class="group"><h2>…</h2><div class="cards">…ProductCard…</div></section>`;
- the first card overall gets `eager`;
- copy the page-level layout CSS (`.page`, header spacing, `.lead`) from `WorkIndexPage.astro`;
- `.cards` uses `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 24px`.

`src/components/ProductCard.astro`:

```astro
---
import Figure from './Figure.astro';
import { formatUsd } from '../lib/offer';
import { productUrl } from '../lib/products';
import { ui } from '../i18n/ui';
import type { Lang } from '../i18n/routes';
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'products'>;
  lang: Lang;
  eager?: boolean;
}
const { entry, lang, eager = false } = Astro.props;
const d = entry.data;
const t = ui[lang].products;
const href = productUrl(lang, d.slug);
---

<article class="product-card">
  <div class="head">
    <span class="id">{d.id}</span>
    <span class="kind">{d.kind === 'install' ? 'INSTALL' : 'DOWNLOAD'}</span>
  </div>
  <Figure shot={{ ...d.cover, caption: '' }} n={0} lang={lang} eager={eager} frame={false} />
  <div class="body">
    <h3>{d.title}</h3>
    <p class="summary">{d.summary}</p>
    <p class="price">
      <span class="from">{t.from}</span> <span class="amount">{formatUsd(d.from)}</span>
    </p>
    <a class="cta" href={href}>
      {t.view}
    </a>
  </div>
</article>
```

Read `Figure.astro`'s props (`shot`, `n`, `lang`, `eager`, `frame`, caption rendering) before wiring. If `n={0}` renders a "FIG. 0" caption, use the same no-caption option `ProjectCard` uses for its cover.

Every card's CTA is "View product →" to the product page. The request or checkout action lives only on the product page, next to its no-JS or provider note.

Card CSS mirrors C08:

- `border: var(--border-ink)`, `background: var(--surface)`, radius 0;
- `.head` is a flex row, with `.id` in `var(--accent)` mono 13;
- `.kind` uses the `Tag` look: mono 12, 1px border, uppercase;
- `.amount` uses the PackageCard amount type;
- `a.cta` has `min-height: 44px; display: inline-flex; align-items: center`;
- hover: `.product-card:hover { border-color: var(--accent) }` with `transition: border-color 200ms` (C08). Check `PackageCard.astro`/`ProjectCard.astro` and copy the exact token names they use.

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/products.spec.ts tests/nav.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit** `feat(pages): add the products index`

### Task 5: Product page, CTA, JSON-LD and OG image

**Files:**

- Create: `src/components/ProductPage.astro`, `src/pages/en/products/[slug].astro`, `src/pages/es/productos/[slug].astro`, `src/pages/og/products/[lang]/[slug].png.ts`
- Modify: `src/layouts/Base.astro` (`ogType` union gets `'product'`)
- Test: `tests/products.spec.ts` (append)

**Interfaces:**

- Consumes: `productPaths`, `twinProduct`, `productUrl`, `ui[lang].products`, `renderSheetOg({ lang, sheet, meta, title, dek })` from `src/lib/og.ts`, `SpecGrid`, `Figure`, `path('contact', lang)`, `caseUrl` from `src/lib/work.ts`.

- [ ] **Step 1: Write the failing tests** (append to `tests/products.spec.ts`)

```ts
test('install product: request CTA to contact with the product, no-JS hint, no JSON-LD', async ({
  page,
}) => {
  await page.goto('/en/products/membership-kit');
  await expect(page.locator('h1')).toHaveText('Church membership kit');
  await expect(page.locator('a.cta-main')).toHaveAttribute('href', '/en/contact?product=PR-01');
  await expect(page.locator('.cta-note')).toContainText('Mention PR-01');
  await expect(page.locator('.includes li')).toHaveCount(4);
  await expect(page.locator('.spec-grid')).toContainText('1–2 weeks');
  await expect(page.locator('.spec-grid a[href="/en/work/churchapp"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'product');
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    'href',
    /\/es\/productos\/kit-de-membresia$/,
  );
});

test('download product: checkout in a new tab, provider note, Product JSON-LD', async ({
  page,
}) => {
  await page.goto('/es/productos/starter-backend-apps-script');
  const buy = page.locator('a.cta-main');
  await expect(buy).toHaveAttribute('href', 'https://checkout.example.com/pr-02');
  await expect(buy).toHaveAttribute('target', '_blank');
  await expect(buy).toHaveAttribute('rel', /noopener/);
  await expect(buy.locator('.visually-hidden')).toHaveText('(se abre en una pestaña nueva)');
  await expect(page.locator('.cta-note')).toContainText('Lemon Squeezy');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('Product');
  expect(ld.offers).toMatchObject({
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'USD',
    url: 'https://checkout.example.com/pr-02',
  });
});

test('product OG image is a 1200×630 PNG', async ({ request }) => {
  const res = await request.get('/og/products/en/membership-kit.png');
  expect(res.headers()['content-type']).toBe('image/png');
  const b = await res.body();
  expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
});
```

Check the repo's visually-hidden class name (`grep -rn "visually-hidden\|sr-only" src/styles src/components | head`) and use that name in both the test and the component.

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test --workers=1 tests/products.spec.ts`
Expected: the three new tests FAIL (404).

- [ ] **Step 3: Implement**

`src/pages/en/products/[slug].astro` (ES twin under `es/productos/`):

```astro
---
import { getCollection } from 'astro:content';
import ProductPage from '../../../components/ProductPage.astro';
import { productsEnabled } from '../../../config/products';
import { productPaths } from '../../../lib/products';

export async function getStaticPaths() {
  return productsEnabled ? productPaths(await getCollection('products'), 'en') : [];
}
const { entry } = Astro.props;
---

<ProductPage lang="en" entry={entry} />
```

`src/components/ProductPage.astro`: frontmatter logic:

```ts
const all = await getCollection('products');
const d = entry.data;
const t = ui[lang].products;
const twin = twinProduct(all, entry);
const ctaHref = d.kind === 'install' ? `${path('contact', lang)}?product=${d.id}` : d.checkoutUrl;
const note =
  d.kind === 'install'
    ? t.noJs.replace('{id}', d.id)
    : t.checkoutBy.replace('{provider}', d.provider);
const rows = [
  [t.stack, d.stack.join(' · ')],
  d.kind === 'install' ? [t.delivery, d.delivery] : [t.format, d.format],
];
const ld =
  d.kind === 'download'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: d.title,
        description: d.summary,
        offers: {
          '@type': 'Offer',
          price: String(d.from),
          priceCurrency: 'USD',
          url: d.checkoutUrl,
        },
      }
    : null;
```

For `case`, find the work entry with `data.id === d.case && data.lang === lang && !data.draft`. If there is one, add a `CASE` row whose value is a link to `caseUrl(lang, slug)`. Read `SpecGrid.astro` to see how it accepts cells. If it only accepts strings, render the CASE link as a `<p class="case-link">` under the grid and point the test at that selector.

Markup:

- `Base` with `ogType="product"`, `title={d.title}`, `description={d.summary}`, `alternate={twin ? productUrl(other(lang), twin.data.slug) : null}`, `ogImage={`/og/products/${lang}/${d.slug}.png`}`;
- the header: `.id`, `.kind`, `<h1>`, `<p class="summary">`;
- `Figure` for the cover (eager) and for each of `shots`;
- `<section class="includes"><h2>{t.includes}</h2><ul>…</ul></section>`;
- `SpecGrid`;
- the CTA block:
  - `<a class="cta-main btn" href={ctaHref}>`;
  - for download, add `target="_blank" rel="noopener"` and `<span class="visually-hidden">{t.newTab}</span>`;
  - `<p class="cta-note">{note}</p>`;
- `{ld && <script type="application/ld+json" set:html={JSON.stringify(ld)} />}`.

Reuse `Button.astro` for the CTA if its props allow `target`, `rel` and extra children; otherwise use a plain `<a>` with the `.btn` classes.

`src/layouts/Base.astro`: `ogType?: 'website' | 'article' | 'product';`.

`src/pages/og/products/[lang]/[slug].png.ts`:

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { productsEnabled } from '../../../../config/products';
import { renderSheetOg } from '../../../../lib/og';
import { ui } from '../../../../i18n/ui';

export async function getStaticPaths() {
  if (!productsEnabled) return [];
  return (await getCollection('products'))
    .filter((p) => !p.data.draft)
    .map((p) => ({ params: { lang: p.data.lang, slug: p.data.slug }, props: { p: p.data } }));
}

export const GET: APIRoute = async ({ props }) => {
  const p = props.p as { lang: 'en' | 'es'; id: string; title: string; summary: string };
  const png = await renderSheetOg({
    lang: p.lang,
    sheet: ui[p.lang].products.sheet,
    meta: p.id,
    title: p.title,
    dek: p.summary,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
```

Check `renderSheetOg`'s exact parameter names in `src/lib/og.ts` before wiring.

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/products.spec.ts tests/seo.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit** `feat(pages): add product pages with checkout and og images`

### Task 6: Contact form: preselected product

**Files:**

- Modify: `src/lib/contact.ts`, `src/lib/contact-handler.ts` (only if the forwarded body needs it; it spreads `parsed.data`), `src/components/ContactForm.astro`, `src/components/ContactPage.astro` (passes `products`)
- Test: `tests/contact-unit.spec.ts`, `tests/contact-api.spec.ts`, `tests/contact.spec.ts`

**Interfaces:**

- Produces:
  - `Brief.product: string` (`''` or `PR-NN`);
  - `Errors` gains `'product'`;
  - `PRODUCT_RE = /^PR-\d{2}$/`;
  - `ContactForm` prop `products?: Record<string, string>` (id → title). It is rendered as `data-products` only when the prop is non-empty.
- Consumes: `productTitles` (Task 2), `productsEnabled` (Task 1), `ui[lang].products.product/remove` (Task 3).

- [ ] **Step 1: Write the failing tests**

`tests/contact-unit.spec.ts`:

```ts
test('product: optional, must be PR-NN', () => {
  const base = { email: 'a@b.co', message: 'Hi' };
  expect(parseBrief(base)).toMatchObject({ ok: true, data: { product: '' } });
  expect(parseBrief({ ...base, product: 'PR-01' })).toMatchObject({
    ok: true,
    data: { product: 'PR-01' },
  });
  for (const product of ['pr-01', 'PR-1', 'PR-001', '=HYPERLINK("x")', 'PR-01 '.repeat(50)])
    expect(parseBrief({ ...base, product }), product).toMatchObject({
      ok: false,
      errors: { product: 'invalid' },
    });
});
```

`tests/contact-api.spec.ts`:

- in the first test's `toEqual`, add `product: ''`;
- add:

```ts
test('a valid product is forwarded; a malformed one is 422', async () => {
  const ok = stubFetch();
  await handleContact(req({ ...valid, product: 'PR-01' }), ENV, ok.fn);
  expect(JSON.parse(ok.calls[1].body).product).toBe('PR-01');
  const bad = stubFetch();
  const res = await handleContact(req({ ...valid, product: 'x' }), ENV, bad.fn);
  expect(res.status).toBe(422);
  expect(bad.calls).toHaveLength(0);
});
```

Check the order: if Turnstile is verified before validation, `bad.calls` has length 1 (the Turnstile call). Assert that no call goes to `script.google.test` instead.

`tests/contact.spec.ts` (e2e, flag on; stub Turnstile as the existing tests do, and copy their setup):

```ts
test('?product= preselects a known product; Remove clears it; unknown ids are ignored', async ({
  page,
}) => {
  await page.goto('/en/contact?product=PR-01');
  const line = page.locator('.product-line');
  await expect(line).toBeVisible();
  await expect(line).toContainText('PR-01 · Church membership kit');
  await expect(page.locator('input[name="product"]')).toHaveValue('PR-01');
  await line.getByRole('button', { name: 'Remove' }).click();
  await expect(line).toBeHidden();
  await expect(page.locator('input[name="product"]')).toHaveValue('');
  for (const q of ['PR-99', 'x', '%3Cb%3E']) {
    await page.goto(`/en/contact?product=${q}`);
    await expect(line).toBeHidden();
    await expect(page.locator('input[name="product"]')).toHaveValue('');
  }
});
```

Also add a check that, after "Remove", the request body has no product. Intercept `/api/contact` with `page.route`, as the existing submit test does, and assert `product` is empty in the posted `FormData`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test --workers=1 tests/contact-unit.spec.ts tests/contact-api.spec.ts tests/contact.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/lib/contact.ts`:

```ts
export const PRODUCT_RE = /^PR-\d{2}$/;
// Brief: add   product: string;
// Errors key union: add 'product'
// in parseBrief:
const product = str(input, 'product');
if (product && !PRODUCT_RE.test(product)) errors.product = 'invalid';
// data: { …, product }
```

`src/components/ContactPage.astro`: compute the product titles only when enabled and pass them down:

```ts
import { getCollection } from 'astro:content';
import { productsEnabled } from '../config/products';
import { productTitles } from '../lib/products';
const products = productsEnabled ? productTitles(await getCollection('products'), lang) : {};
// <ContactForm lang={lang} products={products} />
```

`src/components/ContactForm.astro`:

- props: `products?: Record<string, string>`;
- on `<form>`: `data-products={Object.keys(products).length ? JSON.stringify(products) : undefined}`;
- inside the form, before the name field:

```astro
<input type="hidden" name="product" value="" />
<p class="product-line" hidden>
  <span class="lab">{p.product}</span> <span class="value"></span>
  <button type="button" class="remove">
    {p.remove}
  </button>
</p>
```

where `p = ui[lang].products`;

- in the `<script>`, inside the per-form loop:

```ts
const known = JSON.parse(form.dataset.products ?? '{}') as Record<string, string>;
const productInput = form.elements.namedItem('product') as HTMLInputElement;
const productLine = form.querySelector<HTMLElement>('.product-line')!;
const wanted = new URLSearchParams(location.search).get('product') ?? '';
if (Object.hasOwn(known, wanted)) {
  productInput.value = wanted;
  productLine.querySelector('.value')!.textContent = `${wanted} · ${known[wanted]}`;
  productLine.hidden = false;
}
productLine.querySelector('.remove')!.addEventListener('click', () => {
  productInput.value = '';
  productLine.hidden = true;
  form.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
});
```

CSS:

- `.product-line`: flex row, `border: var(--border-ink)`, `padding: 12px 16px`, mono 13 label;
- `.remove`: `min-height: 44px`, text button styled as a link (underline), no new glyphs.

`textContent` is used, so a title can never inject markup.

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/contact-unit.spec.ts tests/contact-api.spec.ts tests/contact.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit** `feat(contact): preselect a product from the catalogue`

### Task 7: Apps Script: product column and emails

**Files:**

- Modify: `apps-script/Code.gs`, `apps-script/Email.gs`, `apps-script/README.md`
- Test: `tests/email.spec.ts`

**Interfaces:**

- Consumes: the forwarded `product` (`''` or `PR-NN`).
- Produces:
  - sheet column 9 `product`, appended after `noJs`;
  - the owner email row `PRODUCT`;
  - the sender email row `PRODUCT` / `PRODUCTO`. These rows appear only when a product is set.

- [ ] **Step 1: Write the failing tests** (`tests/email.spec.ts`)

```ts
test('product: shown in both emails when set, absent otherwise', () => {
  const withP = { ...brief, product: 'PR-01' };
  expect(renderOwner(withP)).toContain('PR-01');
  expect(renderSender(withP)).toContain('PR-01');
  expect(renderSender({ ...withP, lang: 'es' })).toContain('PRODUCTO');
  expect(renderOwner(brief)).not.toContain('PRODUCT');
});
```

And a sheet-safety unit test via `vm`. Expose the new pure helper `cleanProduct` in the `this.api` line of the test harness:

```ts
test('only a well-formed product id reaches the sheet', () => {
  expect(cleanProduct('PR-01')).toBe('PR-01');
  for (const v of ['=IMPORTXML("x")', 'PR-1', '', undefined, 'PR-01x'])
    expect(cleanProduct(v)).toBe('');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test --workers=1 tests/email.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`apps-script/Code.gs`:

```js
const HEADER = [
  'timestamp',
  'lang',
  'name',
  'email',
  'type',
  'budget',
  'message',
  'noJs',
  'product',
];
/** Only PR-NN ever reaches the sheet (no formula can come in through this column). */
function cleanProduct(v) {
  return /^PR-\d{2}$/.test(String(v || '')) ? String(v) : '';
}
```

In `doPost`:

- `const product = cleanProduct(body.product);`
- append `product` as the last `appendRow` value;
- add `product` to the brief object passed to the renderers (find where `type`/`budget` are added to it).

`getSheet` writes `HEADER` only on an empty sheet. An existing sheet keeps its 8-column header, and the 9th cell lands in column I. README note: "add `product` as the I1 header by hand on an existing sheet".

`apps-script/Email.gs`:

- `renderOwner`: append `['PRODUCT', b.product]` to the `specGrid` rows only when `b.product` is set:
  `...(b.product ? [['PRODUCT', b.product]] : [])`.
- `renderSender`: the same with a localised key. Add `product: 'PRODUCT'` / `product: 'PRODUCTO'` to `SENDER.en` / `SENDER.es`.

`apps-script/README.md`, after the properties table: "SP9: briefs can carry a `product` (PR-NN). Paste the new Code.gs/Email.gs and deploy a new version; on an existing sheet, type `product` in cell I1."

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/email.spec.ts`
Expected: PASS. Also `cp apps-script/Code.gs t.tmp.js && node --check t.tmp.js; rm t.tmp.js`, and the same for `Email.gs`.

- [ ] **Step 5: Commit** `feat(contact): record the requested product in the sheet and emails`

### Task 8: Sitemap, entry links and layout checks

**Files:**

- Modify: `src/pages/sitemap.xml.ts`, `src/components/ServicesPage.astro`, `src/components/CasePage.astro`
- Test: `tests/seo.spec.ts`, `tests/products.spec.ts`, `tests/overflow.spec.ts`

**Interfaces:**

- Consumes: `productsEnabled`, `productUrl`, `ui[lang].products.entry/caseEntry`.

- [ ] **Step 1: Write the failing tests**

`tests/seo.spec.ts`: in the sitemap test, add `/en/products`, `/es/productos` and `/es/productos/kit-de-membresia` to the expected `locs`.

`tests/products.spec.ts`:

```ts
test('entry links: Services and the related case study', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page.locator('a[href="/en/products"]')).toHaveText('Ready-made products →');
  await page.goto('/es/proyectos/churchapp');
  await expect(page.locator('a[href="/es/productos/kit-de-membresia"]')).toHaveText(
    '¿Quieres uno así? Ver PR-01 →',
  );
  await page.goto('/en/work/chapel');
  await expect(page.locator('a[href^="/en/products"]')).toHaveCount(0);
});
```

`tests/overflow.spec.ts`: add `/en/products`, `/es/productos/kit-de-membresia` and `/en/products/workspace-backend-starter` to its URL list. Add 1024 to its widths if it isn't there; this pins the 7-item nav.

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test --workers=1 tests/seo.spec.ts tests/products.spec.ts tests/overflow.spec.ts`
Expected: FAIL on the new expectations.

- [ ] **Step 3: Implement**

`src/pages/sitemap.xml.ts`:

- page filter: `(k !== 'notes' || blogEnabled) && (k !== 'products' || productsEnabled)`;
- add `const products = productsEnabled ? pairsOf(await getCollection('products'), productUrl) : [];` and spread it into the list.

`pairsOf`'s entry type requires `draft: boolean`, which the product schema has.

`ServicesPage.astro`: when `productsEnabled`, render `<a class="link-arrow" href={path('products', lang)}>{ui[lang].products.entry}</a>`. It goes after the service sheets, before the FAQ. Reuse the link style the page already uses for its "→" links.

`CasePage.astro`: when `productsEnabled`, find the product with `data.case === d.id && data.lang === lang && !data.draft`. If found, render `<a href={productUrl(lang, p.data.slug)}>{t.caseEntry.replace('{id}', p.data.id)}</a>` before the "next case" block.

If the nav overflows at 1024 with 7 items, fix it in `SiteNav.astro` CSS: tighten the gap between links, or move the breakpoint at which the MENU button replaces the links. Never hide entries. Record the choice as a ruling.

- [ ] **Step 4: Run to verify**

Run: `npx playwright test --workers=1 tests/seo.spec.ts tests/products.spec.ts tests/overflow.spec.ts tests/nav.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit** `feat(pages): link the catalogue from services, cases and the sitemap`

### Task 9: Verify, roadmap, PR

- [ ] **Step 1:** Run `npm run lint:check && npm run check && npx playwright test --workers=1`. Then the default build: `npm run build && node scripts/check-blog-hidden.mjs && node scripts/check-products-hidden.mjs`.
      Expected: all green, `products hidden: ok`.
- [ ] **Step 2:** Visual QA with both flags on:
  - pages: `/en/products`, `/es/productos`, both product pages, `/en/contact?product=PR-01`;
  - at 1280, 1024, 768 and 375, light and dark;
  - check the card hover border, the hatch on the PR-02 cover (placeholder), the product line and the 44px Remove target.
- [ ] **Step 3:** Run Lighthouse (local, SP8a method) on `/en/products` and one product page, mobile and desktop. Expected: ≥ 95 in every category.
- [ ] **Step 4:** Open the launch-checklist issue, `feat(content): products launch checklist`:
  - real products and copy in EN and ES;
  - PR-02 cover asset;
  - a real `checkoutUrl` and `provider` (create the product in the chosen provider);
  - paste and deploy Apps Script, then add `product` in I1;
  - set `PRODUCTS_ENABLED=true` in Vercel and redeploy;
  - run Lighthouse on production.
- [ ] **Step 5:** Set the roadmap SP9 row to `done (vX.Y.Z)`, commit `docs(docs): mark sp9 done`, push. Fill the PR from the template, owner actions included. The body must **not** contain the version-override keyword.
- [ ] **Step 6:** Final whole-branch review (Opus). Fix Critical and Important findings with failing tests first, then ask the owner for the merge OK.
