# SP8a Launch readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site launch-ready before the domain and the real assets exist:

- one source each for the production URL and the public email;
- sitemap and robots;
- a site-wide OG image and full social meta;
- Vercel Web Analytics on production only;
- `Release-As` tagging;
- Lighthouse ≥ 95 and the handoff QA checklist.

**Architecture:**

- **`src/config/site.ts`** derives `url` from Vercel's `VERCEL_PROJECT_PRODUCTION_URL` and `analytics` from `VERCEL_ENV`. It holds `email` as the single public address.
- **UI copy** interpolates `site.email`. Markdown uses a `{{email}}` token, replaced by a small remark plugin. Apps Script reads `REPLY_TO` and `SITE_URL` script properties.
- **SEO artifacts** are static endpoints built from pure helpers (`src/lib/sitemap.ts`). The OG renderer is generalised to a sheet card.
- **`tag.yml`** delegates to a tested `scripts/next-tag.mjs`.

**Tech Stack:** Astro 7 static output plus the Vercel adapter, vanilla TS, Satori/resvg (already installed), Node 24 (native TS type stripping for one test), Playwright, `npx -y lighthouse` (no repo dependency).

**Spec:** `docs/superpowers/specs/2026-10-08-sp8a-launch-readiness-design.md`

## Global Constraints

- **Dependencies:** npm only, and none new. Lighthouse runs through `npx -y`, not `package.json`.
- **Public address:** `fmyersdev@gmail.com`, and only `src/config/site.ts` contains an email literal or `https://fmyers.dev`. Copy example addresses (`you@company.com`, `tu@empresa.com`) are copy, not contacts, and are allowed.
- **Copy stays verbatim** from the handoff. Only the address and the host change, through `site`.
- **Production URL:** `https://${VERCEL_PROJECT_PRODUCTION_URL}`, with fallback `https://fmyers.dev` (local and tests).
- **Analytics:** Vercel's native snippet, only when `VERCEL_ENV === 'production'` at build.
- **Tags:** `vX.Y.Z` annotated, created only by `tag.yml`. The default is a minor bump of the highest tag; `Release-As: vX.Y.Z` in the merged commit body overrides it and must be greater. Tags are never moved.
- **Process:** `npx playwright test --workers=1` locally. Commits follow `.gitmessage` (scopes `config`, `contact`, `pages`, `ci`, `docs`). Working dir: `.worktrees/sp8-launch` (branch `feature/sp8a-launch-readiness`). Write plan fragments to the ledger folder as `.txt`, never `.ts`, so ESLint doesn't scan them.

## Review Focus

1. **The domain day:** switching the address must be one line (`site.email`) plus the `REPLY_TO` property, and the host must follow `VERCEL_PROJECT_PRODUCTION_URL`. The single-source guard test pins it (Task 2).
2. **A case or note in only one language:** the sitemap lists it once, without alternates. Unit test in Task 4.
3. **The blog off with the production host:** the flag-off check must catch absolute `https://<any host>/en/notes` URLs, not just `fmyers.dev`. Fixture in Task 4.
4. **`Release-As` lower, equal or malformed:** the job fails and no tag is created. Unit test in Task 7.
5. **Missing `REPLY_TO` or `SITE_URL` in Apps Script:** the brief is still saved and you are still notified; the sender copy is skipped rather than sent with a broken address. Code guard in Task 3 (`Code.gs` can't run in CI; reviewed in the final review).

---

### Task 1: Spec and plan as the first commit, draft PR

- [ ] **Step 1: Baseline.** `npx playwright test --workers=1`. Expected: all passed (235 on develop `6801c48`). Ledger it.
- [ ] **Step 2:** Roadmap: set the SP8a status (column 6) to `plan written` and the docs column (7) to `[spec](specs/2026-10-08-sp8a-launch-readiness-design.md) · [plan](plans/2026-10-09-sp8a-launch-readiness.md)`. Print the row split by `|` to confirm. Then:

```bash
npx prettier --write docs/superpowers
git add -A && git commit -m "docs: add sp8a launch readiness spec and plan"
git push -u origin feature/sp8a-launch-readiness
gh pr create --draft --base develop --title "feat(config): make the site launch-ready on the vercel domain" --body-file .github/pull_request_template.md
```

---

### Task 2: Single sources for the production URL and the public email

**Files:**

- Modify:
  - `src/config/site.ts`
  - `src/i18n/ui.ts` (4 strings × 2 languages)
  - `src/content/pages/{en,es}/privacy.md`
  - `astro.config.mjs`
  - `tests/privacy.spec.ts`
- Create: `src/lib/remark-tokens.ts`, `tests/single-source.spec.ts`

**Interfaces — Produces:**

- `site.url: string`, `site.email: string`
- `remarkTokens(tokens: Record<string, string>)`, a remark attacher

- [ ] **Step 1: Failing tests.** Create `tests/single-source.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { remarkTokens } from '../src/lib/remark-tokens';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi;
const COPY_EXAMPLES = /@(company|empresa|example)\.com$/i;

test('the public email and the production URL have one source each', () => {
  const offenders: string[] = [];
  for (const f of [...walk('src'), ...walk('apps-script')]) {
    if (f.replaceAll('\\', '/').endsWith('src/config/site.ts')) continue;
    if (!/\.(ts|astro|mjs|js|md|mdx|json|gs)$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(EMAIL))
      if (!COPY_EXAMPLES.test(m[0])) offenders.push(`${f}: ${m[0]}`);
    if (text.includes('https://fmyers.dev')) offenders.push(`${f}: https://fmyers.dev`);
  }
  expect(offenders).toEqual([]);
});

const siteWith = (env: Record<string, string>) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['-e', "import('./src/config/site.ts').then((m) => console.log(JSON.stringify(m.site)))"],
      { env: { ...process.env, VERCEL_PROJECT_PRODUCTION_URL: '', ...env }, encoding: 'utf8' },
    ),
  );

test('site.url follows the Vercel production domain, with a local fallback', () => {
  expect(siteWith({}).url).toBe('https://fmyers.dev');
  expect(siteWith({ VERCEL_PROJECT_PRODUCTION_URL: 'fmyers-dev.vercel.app' }).url).toBe(
    'https://fmyers-dev.vercel.app',
  );
  expect(siteWith({}).email).toBe('fmyersdev@gmail.com');
});

test('remarkTokens replaces {{email}} in text nodes only', () => {
  const tree = {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text', value: 'Write to {{email}} now.' }] },
    ],
  };
  remarkTokens({ email: 'a@b.co' })()(tree);
  expect(JSON.stringify(tree)).toContain('Write to a@b.co now.');
});

for (const p of [
  { url: '/en/contact', text: 'write to fmyersdev@gmail.com.' },
  { url: '/es/privacidad', text: 'Escribe a fmyersdev@gmail.com' },
  { url: '/en/privacy', text: 'Write to fmyersdev@gmail.com' },
]) {
  test(`${p.url} shows the current public address`, async ({ page }) => {
    await page.goto(p.url);
    const html = await page.content();
    expect(html).not.toContain('{{email}}');
    expect(html).not.toContain('hola@fmyers.dev');
    expect(html.replace(/\s+/g, ' ')).toContain(p.text);
  });
}
```

Run `npx playwright test --workers=1 tests/single-source.spec.ts`. Expected: FAIL (the module is missing; the literals are present).

- [ ] **Step 2: `src/lib/remark-tokens.ts`**

```ts
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

/** Remark plugin: replaces {{name}} tokens in Markdown/MDX text with config values (single sources). */
export function remarkTokens(tokens: Record<string, string>) {
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (all, k: string) => tokens[k] ?? all);
  return () => (tree: MdNode) => {
    const walk = (n: MdNode) => {
      if (n.type === 'text' && n.value) n.value = fill(n.value);
      n.children?.forEach(walk);
    };
    walk(tree);
  };
}
```

- [ ] **Step 3: `src/config/site.ts`**

```ts
// Vercel exposes the production domain at build time: the .vercel.app one today, the custom
// domain once it is added in Vercel. Canonical, OG, RSS and sitemap URLs follow it unchanged.
const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  url: production ? `https://${production}` : 'https://fmyers.dev',
  rev: '2026.10',
  availableFrom: '2026-11',
  // The one public address. hola@fmyers.dev needs the domain + Cloudflare Email Routing (SP8b).
  email: 'fmyersdev@gmail.com',
  whatsapp: '+584249080683',
  github: 'https://github.com/Solideomyers',
  linkedin: 'https://linkedin.com/in/franciscomyers',
} as const;
```

- [ ] **Step 4: Copy.**
  - **`ui.ts`:** add `import { site } from '../config/site';` and replace these strings (EN and ES):
    - `netErr`: `` `The message didn't go through. Try again, or write to ${site.email}.` `` / `` `El mensaje no se envió. Inténtalo de nuevo o escribe a ${site.email}.` ``
    - contact `channels` EMAIL/CORREO `v: site.email`;
    - contact `spec` FROM/DESDE `v: site.email`;
    - `privacyPage.email: site.email.toUpperCase()` (both languages; the handoff shows it uppercase).
  - **`privacy.md` (EN and ES):** replace `hola@fmyers.dev` with `{{email}}`.
  - **`astro.config.mjs`:** add `import { site } from './src/config/site';` and `import { remarkTokens } from './src/lib/remark-tokens';`, and set `markdown: { syntaxHighlight: false, remarkPlugins: [remarkTokens({ email: site.email })] },`. MDX extends the Markdown config by default.
  - **`tests/privacy.spec.ts`:** change `'mailto:hola@fmyers.dev'` to `` `mailto:${site.email}` ``, adding `import { site } from '../src/config/site';`.
- [ ] **Step 5: Run.**
  - `npx prettier --write src tests astro.config.mjs && npm run check && npx playwright test --workers=1 tests/single-source.spec.ts tests/privacy.spec.ts tests/contact.spec.ts tests/routes.spec.ts`
  - Expected: pass, except the guard, which still lists `apps-script/*.gs` offenders until Task 3. Record that.
  - If `npm run check` rejects importing `site.ts` into `astro.config.mjs` (`// @ts-check`), add the `.ts` extension. If that fails too, inline `remarkTokens` there and keep the module only for the test. Ledger the choice.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(config): single sources for the production url and the public email"`

---

### Task 3: Apps Script reads the reply address and site URL from properties

**Files:** Modify `apps-script/Code.gs`, `apps-script/Email.gs`, `apps-script/README.md`, `tests/email.spec.ts`.

- [ ] **Step 1: Failing tests.** In `tests/email.spec.ts`:
  - add `replyTo: 'fmyersdev@gmail.com', siteUrl: 'https://fmyers-dev.vercel.app'` to the `brief` fixture;
  - replace `expect(html).toContain('href="https://fmyers.dev/en/work"');` with:

```ts
expect(html).toContain('href="https://fmyers-dev.vercel.app/en/work"');
expect(html).toContain('reply from fmyersdev@gmail.com');
expect(html).toContain('FMYERSDEV@GMAIL.COM');
expect(html).toContain('fmyers-dev.vercel.app/en/contact');
expect(html).not.toContain('fmyers.dev/en');
```

- in the ES test, replace `'href="https://fmyers.dev/es/proyectos"'` with `'href="https://fmyers-dev.vercel.app/es/proyectos"'` and add `expect(html).toContain('respondo desde fmyersdev@gmail.com');`.

Run. Expected: FAIL.

- [ ] **Step 2: `Email.gs`.**
  - **`SENDER` copy:**
    - `p`: replace `hola@fmyers.dev` with `{email}` in EN and ES;
    - `work`: becomes paths `'/en/work'` / `'/es/proyectos'`;
    - `why`: `'You get this because you sent a brief at {host}/en/contact. No newsletter, no tracking.'` / `'Recibes esto porque enviaste un resumen en {host}/es/contacto. Sin boletín, sin rastreo.'`.
  - **`renderSender`:**

```js
const host = b.siteUrl.replace(/^https?:\/\//, '');
const fill = (s) => s.replace('{email}', b.replyTo).replace('{host}', host);
```

    Use `esc(fill(c.p))`, `actions(b.siteUrl + c.work, …)` and `esc(fill(c.why))`. In the footer, replace the literal `HOLA@FMYERS.DEV` with `${esc(b.replyTo.toUpperCase())}`.

- **Doc comment:** update the `b` comment to list `replyTo` and `siteUrl`.
- [ ] **Step 3: `Code.gs`.** After `const props = …`, add:

```js
const replyTo = props.getProperty('REPLY_TO');
const siteUrl = props.getProperty('SITE_URL');
```

- **`brief`:** add `replyTo` and `siteUrl`.
- **Copy gate:** change `sendCopy = !noJs && takeCopySlot(props);` to `sendCopy = !noJs && Boolean(replyTo && siteUrl) && takeCopySlot(props);`, with the comment `// Without REPLY_TO/SITE_URL the brief is still saved and you are notified; no broken copy is sent.`
- **Reply address:** the sender copy's `replyTo: 'hola@fmyers.dev'` becomes `replyTo: replyTo`.
- [ ] **Step 4: README.** In step 2's properties table, add the two rows:
  - `REPLY_TO`: the public address shown to senders (today `fmyersdev@gmail.com`; `hola@fmyers.dev` once the domain and Email Routing exist);
  - `SITE_URL`: the production URL without a trailing slash (today the `.vercel.app` URL).

  Add to "Updating the script": "after SP8a, set `REPLY_TO` and `SITE_URL`; without them no sender copy is sent".

- [ ] **Step 5: Run.**
  - `cp apps-script/Code.gs c.tmp.js && node --check c.tmp.js; cp apps-script/Email.gs e.tmp.js && node --check e.tmp.js; rm -f c.tmp.js e.tmp.js`
  - `npx playwright test --workers=1 tests/email.spec.ts tests/single-source.spec.ts`
  - Expected: syntax OK; all passing, the guard now included.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(contact): read the reply address and site url from script properties"`

---

### Task 4: Sitemap and robots

**Files:**

- Create:
  - `src/lib/sitemap.ts`
  - `src/pages/sitemap.xml.ts`
  - `src/pages/robots.txt.ts`
  - `tests/sitemap-unit.spec.ts`
  - `tests/seo.spec.ts`
- Modify: `scripts/check-blog-hidden.mjs`, `tests/blog-hidden.spec.ts`

**Interfaces — Produces:**

- `type Pair = Partial<Record<Lang, string>>`
- `sitemapXml(base: string, pairs: Pair[]): string`

- [ ] **Step 1: Failing tests.** `tests/sitemap-unit.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { sitemapXml } from '../src/lib/sitemap';

test('twins get en/es/x-default alternates; single-language pages none', () => {
  const xml = sitemapXml('https://x.app', [{ en: '/en/a', es: '/es/a' }, { en: '/en/solo' }]);
  expect(xml).toContain('<loc>https://x.app/en/a</loc>');
  expect(xml).toContain('<loc>https://x.app/es/a</loc>');
  expect(xml.match(/hreflang="x-default" href="https:\/\/x\.app\/en\/a"/g)).toHaveLength(2);
  expect(xml).toMatch(/<url><loc>https:\/\/x\.app\/en\/solo<\/loc><\/url>/);
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});
```

`tests/seo.spec.ts`:

```ts
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
```

Append to `tests/blog-hidden.spec.ts`:

```ts
test('catches absolute URLs on any host (production runs on the Vercel domain)', () => {
  expect(run(site({ 'sitemap.xml': '<loc>https://fmyers-dev.vercel.app/en/notes</loc>' }))).toBe(1);
  expect(run(site({ 'en/a.html': '<link href="https://fmyers-dev.vercel.app/es/notas/x">' }))).toBe(
    1,
  );
});
```

Run all three. Expected: FAIL.

- [ ] **Step 2: `src/lib/sitemap.ts`**

```ts
import { LANGS, type Lang } from '../i18n/routes';

/** A page and its translation; a single-language page has one key. */
export type Pair = Partial<Record<Lang, string>>;

export function sitemapXml(base: string, pairs: Pair[]): string {
  const abs = (p: string) => new URL(p, base).href;
  const urls = pairs.flatMap((pair) => {
    const langs = LANGS.filter((l) => pair[l]);
    const alternates =
      langs.length === 2
        ? [...langs.map((l) => [l, pair[l]!] as const), ['x-default', pair.en!] as const]
            .map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(p)}"/>`)
            .join('')
        : '';
    return langs.map((l) => `<url><loc>${abs(pair[l]!)}</loc>${alternates}</url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`;
}
```

- [ ] **Step 3: Endpoints.** `src/pages/sitemap.xml.ts`:

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { blogEnabled } from '../config/blog';
import { site } from '../config/site';
import { ROUTES, type RouteKey } from '../i18n/routes';
import { noteUrl } from '../lib/notes';
import { sitemapXml, type Pair } from '../lib/sitemap';
import { caseUrl } from '../lib/work';

const NOINDEX: RouteKey[] = ['contactSent'];

/** Published entries grouped by id into language pairs. */
function pairsOf(
  entries: { data: { id: string; lang: 'en' | 'es'; slug: string; draft: boolean } }[],
  url: (l: 'en' | 'es', s: string) => string,
) {
  const byId = new Map<string, Pair>();
  for (const e of entries.filter((x) => !x.data.draft))
    byId.set(e.data.id, { ...byId.get(e.data.id), [e.data.lang]: url(e.data.lang, e.data.slug) });
  return [...byId.values()];
}

export const GET: APIRoute = async () => {
  const pages: Pair[] = (Object.keys(ROUTES) as RouteKey[])
    .filter((k) => !NOINDEX.includes(k) && (k !== 'notes' || blogEnabled))
    .map((k) => ({ ...ROUTES[k] }));
  const work = pairsOf(await getCollection('work'), caseUrl);
  const notes = blogEnabled ? pairsOf(await getCollection('notes'), noteUrl) : [];
  return new Response(sitemapXml(site.url, [...pages, ...work, ...notes]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
```

`src/pages/robots.txt.ts`:

```ts
import type { APIRoute } from 'astro';
import { site } from '../config/site';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /ds\n\nSitemap: ${site.url}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
```

- [ ] **Step 4: `check-blog-hidden.mjs`.** Generalise the host in both regexes:
  - `ATTR`: `(?:https?:\/\/[^\/"'\s]+)?` replaces `(?:https:\/\/fmyers\.dev)?`;
  - `URL_TEXT`: `https?:\/\/[^\/"'\s<]+` replaces `https:\/\/fmyers\.dev`.

  Write the file with the Write tool, not a shell heredoc (escapes).

- [ ] **Step 5: Run.**
  - `npx prettier --write src tests scripts && npm run check && npx playwright test --workers=1 tests/sitemap-unit.spec.ts tests/seo.spec.ts tests/blog-hidden.spec.ts`
  - Expected: pass.
  - Then run `npm run build && node scripts/check-blog-hidden.mjs`. Expected: `blog hidden: ok`. The sitemap with the blog off lists no notes.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(pages): add sitemap and robots"`

---

### Task 5: Site-wide OG image and full social meta

**Files:**

- Modify:
  - `src/lib/og.ts` (`renderSheetOg`, with `renderNoteOg` as a wrapper)
  - `src/layouts/Base.astro`
  - `src/components/CasePage.astro`
  - `src/components/NotePage.astro` (`ogType="article"`)
- Create: `src/pages/og/site/[lang].png.ts`
- Test: append to `tests/seo.spec.ts`

**Interfaces — Produces:**

- `renderSheetOg({ lang, sheet, meta, title, dek }): Promise<Uint8Array>`
- Base props `ogImage?: string` (default `/og/site/{lang}.png`) and `ogType?: 'website' | 'article'`

- [ ] **Step 1: Failing tests** (append):

```ts
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
```

Run. Expected: FAIL.

- [ ] **Step 2: `og.ts`.** Rename `renderNoteOg`'s body into:

```ts
export async function renderSheetOg(c: {
  lang: 'en' | 'es';
  sheet: string;
  meta: string;
  title: string;
  dek: string;
}): Promise<Uint8Array> {
```

- **Header row:** the two children are `h({}, c.sheet)` and `h({}, c.meta)`.
- **Body:** the title and dek come from `c`.
- **Note wrapper,** so the note images stay byte-identical in layout:

```ts
export const renderNoteOg = (n: {
  id: string;
  lang: 'en' | 'es';
  category: string;
  title: string;
  dek: string;
}) =>
  renderSheetOg({
    lang: n.lang,
    sheet: `${n.lang === 'es' ? 'LÁMINA 07 — NOTAS' : 'SHEET 07 — NOTES'} · ${n.id}`,
    meta: n.category.toUpperCase(),
    title: n.title,
    dek: n.dek,
  });
```

- [ ] **Step 3: `src/pages/og/site/[lang].png.ts`**

```ts
import type { APIRoute } from 'astro';
import { ui } from '../../../i18n/ui';
import type { Lang } from '../../../i18n/routes';
import { renderSheetOg } from '../../../lib/og';

export function getStaticPaths() {
  return [{ params: { lang: 'en' } }, { params: { lang: 'es' } }];
}

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const t = ui[lang];
  const png = await renderSheetOg({
    lang,
    sheet: t.home.sheet00,
    meta: '',
    title: t.h1.home,
    dek: t.home.lead,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
```

- [ ] **Step 4: `Base.astro`.**
  - **Props:** add `ogType?: 'website' | 'article';` and destructure `ogImage = \`/og/site/${lang}.png\``, `ogType = 'website'`. Import `ui` if it isn't already.
  - **Head:** replace the `{ogImage && (…)}` block with:

```astro
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description ?? ui[lang].home.lead} />
<meta property="og:url" content={site.url + pathname} />
<meta property="og:type" content={ogType} />
<meta property="og:site_name" content="fmyers.dev" />
<meta property="og:locale" content={lang === 'es' ? 'es_ES' : 'en_US'} />
{hasTwin && <meta property="og:locale:alternate" content={lang === 'es' ? 'en_US' : 'es_ES'} />}
<meta property="og:image" content={new URL(ogImage, site.url).href} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

- **Pages:** pass `ogType="article"` from `CasePage` (its `<Base …>`) and from `NotePage`.
- [ ] **Step 5: Run.** `npx prettier --write src tests && npm run check && npx playwright test --workers=1 tests/seo.spec.ts tests/notes.spec.ts tests/case.spec.ts`. Expected: pass. View `.vercel/output/static/og/site/es.png` with the Read tool: the title and dek fit, and the wordmark is clear. Ledger what you saw.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(pages): add a site-wide og image and full social meta"`

---

### Task 6: Vercel Web Analytics on production only

**Files:** Modify `src/config/site.ts` (`analytics`), `src/components/HeadCommon.astro`. Test: append to `tests/single-source.spec.ts` and `tests/seo.spec.ts`.

- [ ] **Step 1: Failing tests.** In `single-source.spec.ts`:

```ts
test('analytics only on the production deploy', () => {
  expect(siteWith({}).analytics).toBe(false);
  expect(siteWith({ VERCEL_ENV: 'preview' }).analytics).toBe(false);
  expect(siteWith({ VERCEL_ENV: 'production' }).analytics).toBe(true);
});
```

Pass `VERCEL_ENV: ''` in `siteWith`'s default env, next to `VERCEL_PROJECT_PRODUCTION_URL: ''`. In `seo.spec.ts`:

```ts
test('no analytics script outside production', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('script[src*="/_vercel/insights/"]')).toHaveCount(0);
});
```

Run. Expected: the first FAILS (`undefined`); the second passes and stays as a guard.

- [ ] **Step 2: `site.ts`.** Add, after `linkedin`:

```ts
  // Vercel Web Analytics (cookieless, aggregate): production deploys only, never previews or tests.
  analytics: process.env.VERCEL_ENV === 'production',
```

- [ ] **Step 3: `HeadCommon.astro`.** Import `site`, and after the icon links add:

```astro
{site.analytics && (
  <>
    <script is:inline>
      window.va =
        window.va ||
        function () {
          (window.vaq = window.vaq || []).push(arguments);
        };
    </script>
    <script is:inline defer src="/_vercel/insights/script.js"></script>
  </>
)}
```

- [ ] **Step 4: Run.** `npx prettier --write src tests && npm run check && npx playwright test --workers=1 tests/single-source.spec.ts tests/seo.spec.ts`. Expected: pass.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(config): load vercel web analytics on production only"`

---

### Task 7: `Release-As` tagging

**Files:**

- Create: `scripts/next-tag.mjs`, `tests/next-tag.spec.ts`
- Modify: `.github/workflows/tag.yml`, `CONTRIBUTING.md` (tags table), `CLAUDE.md` (tags line)

**Interfaces — Produces:** `nextTag({ tags: string[], message: string }): string` (throws on an invalid `Release-As`).

- [ ] **Step 1: Failing test.** `tests/next-tag.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { nextTag } from '../scripts/next-tag.mjs';

const tags = ['v0.1.0', 'v0.9.0', 'v0.10.0', 'v0.2.0', 'not-a-tag'];

test('default: minor bump of the highest semver tag', () => {
  expect(nextTag({ tags, message: 'feat(x): y' })).toBe('v0.11.0');
  expect(nextTag({ tags: [], message: '' })).toBe('v0.1.0');
  expect(nextTag({ tags: [...tags, 'v1.0.0'], message: 'fix(x): y' })).toBe('v1.1.0');
});

test('Release-As overrides when greater; lower, equal or malformed fail', () => {
  expect(nextTag({ tags, message: 'chore: launch\n\nRelease-As: v1.0.0\n' })).toBe('v1.0.0');
  expect(() => nextTag({ tags, message: 'Release-As: v0.10.0' })).toThrow(/greater/);
  expect(() => nextTag({ tags, message: 'Release-As: v0.3.0' })).toThrow(/greater/);
  expect(() => nextTag({ tags, message: 'Release-As: 1.0' })).toThrow(/vX\.Y\.Z/);
});
```

Run. Expected: FAIL.

- [ ] **Step 2: `scripts/next-tag.mjs`** (write it with the Write tool, because of the regexes):

```js
// Next release tag for .github/workflows/tag.yml (run on every merge to develop).
// Default: bump the minor of the highest vX.Y.Z tag. Override: a "Release-As: vX.Y.Z" line in the
// merged commit message (the squash body is the PR body); it must be greater than every tag.
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SEMVER = /^v(\d+)\.(\d+)\.(\d+)$/;
const parse = (t) => {
  const m = SEMVER.exec(t);
  return m ? m.slice(1).map(Number) : null;
};
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function nextTag({ tags, message }) {
  const last = tags.map(parse).filter(Boolean).sort(cmp).at(-1) ?? [0, 0, 0];
  const asked = /^Release-As:\s*(\S+)\s*$/m.exec(message);
  if (asked) {
    const v = parse(asked[1]);
    if (!v) throw new Error(`Release-As "${asked[1]}" is not vX.Y.Z`);
    if (cmp(v, last) <= 0)
      throw new Error(`Release-As ${asked[1]} must be greater than v${last.join('.')}`);
    return asked[1];
  }
  return `v${last[0]}.${last[1] + 1}.0`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' });
  try {
    console.log(
      nextTag({
        tags: git("tag --list 'v*'").split('\n').filter(Boolean),
        message: git('log -1 --format=%B'),
      }),
    );
  } catch (e) {
    console.error(`::error::${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 3: `tag.yml`.** Add `- uses: actions/setup-node@v4` with `with: { node-version-file: .nvmrc }` after checkout, and replace the `run` block:

```yaml
- name: Tag the next version (annotated, canonical)
  run: |
    if git tag --points-at HEAD | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
      echo "HEAD already tagged: $(git tag --points-at HEAD)"
      exit 0
    fi
    NEXT=$(node scripts/next-tag.mjs)
    git -c user.name='github-actions[bot]' \
        -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
        tag -a "$NEXT" -m "$NEXT — $(git log -1 --format=%s)"
    git push origin "$NEXT"
```

Rename the step comment to match.

- [ ] **Step 4: Docs.**
  - **CONTRIBUTING tags table:**
    - Format → `vMAJOR.MINOR.PATCH`, always **annotated**;
    - When → `Every merge to develop → minor bump of the highest tag (scripts/next-tag.mjs)`;
    - add a row **Override** → ``A `Release-As: vX.Y.Z` line in the PR description (the squash body); must be greater than every tag, otherwise the job fails and nothing is tagged``;
    - `v1.0.0` row → `` Reserved for the public launch: the SP8b launch PR carries `Release-As: v1.0.0` ``;
    - the idempotency row → `v*` instead of `v0.*`.
  - **CLAUDE.md tags line:** `- Tags: annotated vX.Y.Z, created only by tag.yml on merge to develop (minor bump, or Release-As: vX.Y.Z in the PR body). Never create, move or delete tags yourself. v1.0.0 is reserved for the launch (Release-As in the SP8b PR).`
- [ ] **Step 5: Run.** `npx prettier --write scripts tests CONTRIBUTING.md CLAUDE.md .github && npx eslint scripts tests && npx playwright test --workers=1 tests/next-tag.spec.ts && node scripts/next-tag.mjs`. Expected: tests pass, and the CLI prints `v0.10.0` (tags up to v0.9.0, a HEAD message with no `Release-As`).
- [ ] **Step 6: Commit.** `git add -A && git commit -m "ci: tag releases with a Release-As override for the launch"`

---

### Task 8: Lighthouse and the handoff QA checklist

- [ ] **Step 1: Lighthouse.** Run `npm run build`, then `node scripts/serve-static.mjs .vercel/output/static 4350`, then for each URL in `/en`, `/en/work`, `/en/work/churchapp`, `/en/contact` and `/es/precios`:

```bash
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" \
npx -y lighthouse "http://localhost:4350$URL" --quiet --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo --output=json \
  --output-path="<ledger dir>/lh-$(echo $URL | tr / _)-mobile.json"
```

Run it again with `--preset=desktop` (output `…-desktop.json`). Summarise the four category scores per run with `node -e` reading the JSONs.

- **Below 95:** list the failing audits (`audits[*].score < 1` in that category). Fix them in code, with a test when it's behavioural, and commit with the right scope (`fix(pages): …`, `perf(…)` → use `fix(scope)`).
- **Unfixable here:** findings caused by the static test server rather than Vercel (compression, HTTP/2, cache headers) get a ledger Ruling and are re-checked on the Vercel preview with `npx -y lighthouse <preview URL>`. Previews are protected, so if it is blocked, note it.
- [ ] **Step 2: QA checklist** (handoff README "QA checklist"). For each item, ledger the evidence:
  - **4× slow motion:** a manual note, plus the SP6 captures.
  - **Reduced motion and fades only:** `motion.spec`.
  - **JS off, reveal visible and the form posts:** `motion.spec`, `contact.spec`.
  - **Touch, no hover:** `motion.spec` and the `(hover: hover)` CSS gating.
  - **Safari/Firefox without View Transitions:** manual (Firefox via `npx playwright test --project`), or a note.
  - **375 no overflow:** `overflow.spec`. Add the two note URLs to its `extra` list here, since the SP7 review left that deferred.
- [ ] **Step 3: Full suite.** `npm run lint:check && npm run check && npx playwright test --workers=1` (green); then `npm run build && node scripts/check-blog-hidden.mjs` (`blog hidden: ok`).

---

### Task 9: Roadmap, PR, review

- [ ] **Step 1: Roadmap.** Set SP8a to `done (vX.Y.Z)`, with the next tag computed by `node scripts/next-tag.mjs` on develop after the merge. Write `done` and let the tag column be filled from the merge. Update the memory note.
- [ ] **Step 2: Commit and CI.** Commit, push, watch CI, and check the Vercel status. On the Vercel preview, check that:
  - `/sitemap.xml` and `/robots.txt` use the production `.vercel.app` host, which proves `VERCEL_PROJECT_PRODUCTION_URL` reaches the build;
  - there is no analytics script (preview).
- [ ] **Step 3: PR body.** Fill it from the template, including:
  - the owner actions: paste `Code.gs`/`Email.gs`, set `REPLY_TO` and `SITE_URL`, check the Turnstile hostname, confirm enabling Vercel Web Analytics;
  - the Lighthouse table;
  - the QA checklist evidence;
  - "no new dependency".
- [ ] **Step 4: Review.** Run the final whole-branch review (Opus), then ask the user for the merge OK. Enabling Web Analytics in Vercel is a separate confirmation.
