# SP1 — Shell & i18n · Design

Date: 2026-10-06 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp1-shell`

## Goal

A navigable, empty site in both languages and both themes: base layout, language routing with translated slugs, root language redirect, theme without flash, SiteNav (C10), SiteFooter, LangSwitch + ThemeToggle (C11), site config and the 404 (P07, static). Every screen is a stub with its real `<h1>`. Screens are built in SP3, motion in SP5.

## Decisions (approved in brainstorming)

- **Route model A:** one route map plus thin per-language pages. No Astro `i18n` config (it doesn't translate slugs) and no catch-all `[lang]/[...slug]`.
- The SP0 token-check page is removed; `/` becomes the language redirect. Specimens come back in SP2 at `/_ds`.
- Out of scope: `<ClientRouter />`, theme circular reveal (D06), language fade/scroll keeping (D07), menu animation (D08), 404 strokes (D15) → SP5. `contact/sent` → SP4. Notes routes → SP6.

## Files

```
src/config/site.ts        site config
src/i18n/routes.ts        route map + helpers
src/i18n/ui.ts            shell copy EN/ES
src/layouts/Base.astro    html shell
src/components/SiteNav.astro · SiteFooter.astro · LangSwitch.astro · ThemeToggle.astro
src/pages/index.astro     root redirect
src/pages/en/{index,services,work,about,pricing,contact,privacy}.astro
src/pages/es/{index,servicios,proyectos,sobre-mi,precios,contacto,privacidad}.astro
src/pages/404.astro
src/components/HeadCommon.astro  shared head (meta, theme script, fonts, favicons) for Base and 404
src/components/Stub.astro        stub page body (Base + h1)
tests/*.spec.ts
```

## Units

### `src/config/site.ts`

```ts
export const site = {
  url: 'https://fmyers.dev',
  rev: '2026.10',
  availableFrom: '2026-11',
  blogEnabled: false,
  email: 'hola@fmyers.dev',
  whatsapp: '+584249080683',
  github: 'https://github.com/Solideomyers',
  linkedin: 'https://linkedin.com/in/franciscomyers',
} as const;
```

`budgets`, `projectTypes`, `formEndpoint` and `turnstileSiteKey` are added in SP4, where they are used.

### `src/i18n/routes.ts`

- `type Lang = 'en' | 'es'`, `LANGS: Lang[] = ['en', 'es']`.
- `ROUTES` (`as const`), the only place URLs are written:

| key      | en             | es               |
| -------- | -------------- | ---------------- |
| home     | `/en`          | `/es`            |
| services | `/en/services` | `/es/servicios`  |
| work     | `/en/work`     | `/es/proyectos`  |
| about    | `/en/about`    | `/es/sobre-mi`   |
| pricing  | `/en/pricing`  | `/es/precios`    |
| contact  | `/en/contact`  | `/es/contacto`   |
| privacy  | `/en/privacy`  | `/es/privacidad` |

- `path(key, lang): string`.
- `routeKeyOf(pathname): RouteKey | undefined`. It ignores a trailing slash.
- `alternateOf(pathname, alternate?)`: returns `alternate` if passed (`string`, or `null` = no translation); otherwise the other language's path for the matching key; otherwise that language's home.
- `NAV: RouteKey[] = ['services', 'work', 'about', 'pricing', 'contact']`, numbered `01…05` in that order (`06 NOTES` is appended in SP6 when `blogEnabled`).

### `src/i18n/ui.ts`

`ui[lang]`. Copy is taken verbatim from the handoff `COPY` objects:

- nav: `SERVICES, WORK, ABOUT, PRICING, CONTACT` / `SERVICIOS, PROYECTOS, SOBRE MÍ, PRECIOS, CONTACTO`
- `menu: MENU/MENÚ`, `close: CLOSE/CERRAR`, `startCaps: START A PROJECT/INICIAR PROYECTO`, `privacy: PRIVACY/PRIVACIDAD`, `langName: ENGLISH/ESPAÑOL`, `themeLabel: Toggle theme/Cambiar tema`, `homeLabel: fmyers.dev home/inicio de fmyers.dev`
- h1 per stub (from each screen's `COPY.h1`):
  - Home: `I build SaaS products end to end.` / `Construyo productos SaaS de punta a punta.`
  - Services: `Three ways to work together.` / `Tres formas de trabajar juntos.`
  - Work: `Work` / `Proyectos`
  - About: `Francisco Myers`
  - Pricing: `Clear starting prices. A fixed quote after the spec.` / `Precios de partida claros. Cotización fija tras la especificación.`
  - Contact: `Tell me what you're building.` / `Cuéntame qué estás construyendo.`
  - Privacy: `Privacy` / `Privacidad`
- 404: from `Not Found.dc.html` (`sheet`, `missing`, `h1`, `p`, `home`, `links`).

### `src/layouts/Base.astro`

Props: `{ lang: Lang; title: string; description?: string; alternate?: string | null }`.

Head, in this order:

1. charset, viewport, `<title>{title} · fmyers.dev</title>` (home: `fmyers.dev — {h1}`), description.
2. **Theme script, inline and blocking:** `try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch {}`.
3. Fonts: `preconnect` + Google Fonts `<link>` (same URL as SP0).
4. `<link rel="canonical">` = `site.url + pathname`. `<link rel="alternate" hreflang>` for both languages when an alternate exists, plus `x-default` → `/en` equivalent.
5. Favicon: `/logo-light.svg` / `/logo-dark.svg` (already in `public/`) via `media="(prefers-color-scheme: …)"`.

`<html lang={lang}>`. Body: `<SiteNav lang currentKey alternate/>`, `<main>` with the page padding from the handoff (top `clamp(24px,4cqi,48px)`, bottom `clamp(56px,8cqi,96px)`, max-width `--page-max`, gutter `--gutter`), `<SiteFooter lang/>`. `body` sets `container-type: inline-size` (handoff: the cqi type scale relies on it).

### `SiteNav.astro` (C10)

Values are from `Home.dc.html`. Sticky `top:0`, `z-index:5`, `--bg`, `border-bottom: var(--border-ink)`. Inner row padding `12px var(--gutter)`, gap 20px.

- Wordmark: link to home (`aria-label` homeLabel). Two `<img>` (light/dark, height 24px), shown by CSS according to the effective theme (`[data-theme]` first, else `prefers-color-scheme`).
- Desktop links (≥1200px): mono 13px, letter-spacing 1px, gap 22px. Each is `<span muted>0N</span>LABEL`. Hover goes accent (fine pointer only). The current link has `aria-current="page"`, colour accent and a 2px accent underline.
- LangSwitch + ThemeToggle: ≥640px (in the header); <640px only inside the menu.
- CTA `START A PROJECT` → contact: ≥1200px only. Mono 13, accent bg, `--accent-fg`, padding `10px 16px`.
- MENU button: <1200px. `aria-expanded`, `aria-controls="site-menu"`, min-height 44px, padding `0 14px`, 1px ink border. Label MENU ↔ CLOSE.
- Menu panel `#site-menu` (hidden by default): full-width rows, min-height 52px, mono 15px, `border-bottom: var(--border-rule)`, row padding `0 var(--gutter)`. Footer row has LangSwitch (44px tall cells, mono 13) + ThemeToggle (44px) + CTA (min-height 44px).
- Script: toggles `hidden` and `aria-expanded`. It closes on Escape (and returns focus to the button), on a link click, and when the viewport crosses to ≥1200px.
- No JS: `<noscript><style>#site-menu{display:flex}</style></noscript>` and the MENU button hidden.

**Breakpoint rationale:** the handoff gives 1280/768/375 only. The full desktop row is estimated at ~1150px at 13px mono, so the desktop layout starts at 1200px (it fits) and tablet covers 640–1199px. Tests pin no overflow at 1200 and at 1199.

### `LangSwitch.astro` (C11)

Two `<a>`: EN | ES inside a 1px ink border. The active one uses `--invert-bg`/`--invert-fg` and `aria-current="true"`. The inactive one links to `alternateOf(pathname, alternate)`, with `hreflang` and `lang` attributes. Mono 12px, padding `7px 10px` (header); 13px, 44px tall (menu). Click (JS) runs `localStorage.setItem('lang', target)`. When `alternate === null` the inactive cell is not a link (`aria-disabled`, muted).

### `ThemeToggle.astro` (C11)

`<button aria-label={themeLabel}>◐</button>`, square, 34px (header) / 44px (menu), 1px ink border, transparent. Click: effective = `dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')`; set the opposite on `<html>` and in `localStorage.theme`. All toggles on the page stay in sync (one shared handler).

### `SiteFooter.astro`

Values are from `Home.dc.html`: `border-top: var(--border-ink)`, padding `20px var(--gutter)`, flex-wrap, gap `12px 32px`, space-between, mono 12px, letter-spacing 1px, muted.

- `FMYERS.DEV · REV {site.rev}`
- `GITHUB ↗`, `LINKEDIN ↗`, `WHATSAPP ↗` (external, `rel="noopener"`), `PRIVACY` → privacy route
- `© 2026 · {langName}`

### `src/pages/index.astro` (root redirect)

Minimal document (no nav), `noindex`.

- Inline script: `lang = localStorage.lang ∈ {en,es}` (in try/catch), else **the first** `navigator.languages` entry: starts with `es` → `es`, else `en` (a user with `en-US, es` gets English). Then `location.replace('/' + lang)`.
- `<noscript>`: `<meta http-equiv="refresh" content="0; url=/en">` plus visible links `English → /en`, `Español → /es`.

### Stub pages

Each is `<Base lang title alternate?>` with `<h1>{ui[lang].h1.key}</h1>` styled with the Page H1 token (Display XL for home). Nothing else.

### `src/pages/404.astro` (P07, static)

One `404.html` for all paths, holding both languages:

- Head script (before paint): `es = location.pathname.startsWith('/es')`. Set `<html lang>` and `data-lang="es|en"`. Fill `[data-path]` with `location.pathname` on DOMContentLoaded.
- CSS: `[data-lang="es"] .l-en, :root:not([data-lang="es"]) .l-es { display:none }`. Each language block contains its own SiteNav + content + SiteFooter.
- Content: sheet label, the requested path, `NOT FOUND`, h1, paragraph, `Back home` + `WORK` / `CONTACT` links. Static layout only; diagonals in SP5.
- No JS: the EN version shows.

## Error handling

- localStorage can throw (privacy modes): every access sits in try/catch and falls back to the OS theme / browser language.
- Unknown `lang` values in storage are ignored.
- A path not in `ROUTES` gives `alternateOf` → the other language's home (never a 404 link).

## Testing (Playwright)

Port 4329 and no server reuse (from SP0). New spec files:

- `routes.spec.ts`: for every route × language, status 200, `html[lang]`, h1 text, exactly one `aria-current="page"` nav link (except home), the hreflang/canonical hrefs return 200.
- `redirect.spec.ts`: locale `es-VE` → `/es`; `en-US` → `/en`; `localStorage.lang='es'` with `en-US` → `/es`; JS disabled → `/en` via meta refresh.
- `lang-switch.spec.ts`: on `/en/services`, ES links to `/es/servicios`; clicking it stores `lang=es`.
- `theme.spec.ts`: dark OS + no storage → dark `--bg`; toggle → light, persisted after reload; stored theme applied on first paint (attribute present at `DOMContentLoaded`).
- `nav.spec.ts`: 1280: links + CTA visible, MENU hidden. 1200: same, no overflow. 1199 and 768: MENU + LangSwitch visible, links hidden. 375: only MENU. Menu opens (aria-expanded true, rows ≥ 52px), Escape closes and refocuses the button. No NOTES while `blogEnabled` is false. JS disabled at 375: menu links visible.
- `overflow.spec.ts`: every route at 375/768/1199/1200/1280, `scrollWidth <= innerWidth`.
- `404.spec.ts`: `/en/nope` → status 404, EN h1, shows `/en/nope`; `/es/nope` → ES h1, `html[lang=es]`.
- `smoke.spec.ts` (SP0) is replaced by the above; `tokens.spec.ts` stays.

## Done when

- All tests pass locally and in CI; Vercel preview shows the shell.
- Manual check of the preview at 1280/768/375, EN/ES, light/dark against the handoff `Home.dc.html` header/footer.
- Roadmap SP1 row updated in the PR.
