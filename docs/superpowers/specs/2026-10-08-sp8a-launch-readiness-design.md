# SP8a Launch readiness — design

**Status:** approved in conversation 2026-10-08 · **Branch:** `feature/sp8a-launch-readiness` · **Release:** next `develop` tag

## Context and split

The roadmap's SP8 Launch is split, by owner decision (2026-10-08):

- **SP8a Launch readiness** (this spec): everything that is code and doesn't depend on assets the owner doesn't have yet.
- **SP8b Go live** (later):
  - **Assets:** the real portrait, ChurchApp screenshots with sample data, final prices (the $150 maintenance price appears in 8 places), the FM-02 metrics date and N-02's date/figure.
  - **Domain:** buying it, plus `hola@fmyers.dev` through Cloudflare Email Routing.
  - **Release:** the first release to `main` under the release rule (`chore: release …`, merge commit), with `Release-As: v1.0.0`.

Owner decisions that shape SP8a:

- **No domain yet:** production runs on the Vercel domain until one is bought.
- **Public email:** `fmyersdev@gmail.com` until the domain exists. `hola@fmyers.dev` would bounce.
- **Analytics:** Vercel Web Analytics (cookieless, no banner). The handoff named Cloudflare or Umami; the owner chose Vercel.

Goal: nothing on the site points at things that don't exist, and every page is shareable and indexable. Analytics are in place, a launch can be tagged `v1.0.0`, and Lighthouse and the handoff QA checklist pass.

## 1. Production URL and public email: one source each

### `site.url`

`src/config/site.ts`: `url` comes from `process.env.VERCEL_PROJECT_PRODUCTION_URL` (a Vercel system variable present at build). Today it is the `.vercel.app` production domain, and it becomes the custom domain automatically once one is added in Vercel:

```ts
const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
url: prod ? `https://${prod}` : 'https://fmyers.dev',
```

- **Fallback.** `https://fmyers.dev` is kept for local builds and tests, so the existing URL assertions stay stable.
- **Consumers.** Every absolute URL already goes through `site.url`: canonical, hreflang, RSS, `og:image`, and the new sitemap, robots and OG meta.
- **Check.** No other file may hardcode `https://fmyers.dev`. Exceptions: the wordmark text, the tests, and the OG card's visible `fmyers.dev` brand text.

### `site.email`

- **Value.** `site.email` becomes `fmyersdev@gmail.com`. It is the only source of the public address.
- **UI copy.** In `src/i18n/ui.ts`, every string that embeds the address (`netErr`, the EMAIL channel value, the confirmation `FROM` value, the privacy `email` label) uses `site.email`, or `site.email.toUpperCase()` where the handoff shows it uppercase. Only the address changes; the copy stays verbatim.
- **Markdown.** The privacy pages (`src/content/pages/*/privacy.md`) write `{{email}}`. A tiny remark plugin in `astro.config.mjs` replaces `{{email}}` with `site.email` in every Markdown/MDX text node.
- **Apps Script.**
  - `Code.gs` `replyTo` and the `Email.gs` copy (the sender paragraph and the footer) read the address from a new script property `REPLY_TO` (required, documented in `apps-script/README.md` step 2).
  - `renderSender`/`renderOwner` receive it as `b.replyTo`.
  - The owner pastes the new files and sets `REPLY_TO=fmyersdev@gmail.com` once.
- **Guard test.** No file under `src/` or `apps-script/` other than `src/config/site.ts` contains an email address literal (`/[\w.+-]+@[\w-]+\.[\w.]+/`). When the domain arrives, switching to `hola@fmyers.dev` means changing `site.email` and the `REPLY_TO` property.

## 2. SEO and sharing

### Sitemap

`src/pages/sitemap.xml.ts` (static endpoint, no dependency) emits a `urlset` with `xhtml:link` alternates:

- **Every key in `ROUTES` except `contactSent` (noindex), in both languages.** `notes` is included only when `blogEnabled`. Each entry carries `hreflang` alternates for EN, ES and `x-default` (EN).
- **Case studies.** The published ones listed by `listCases`, with an alternate only when a twin exists.
- **Notes.** The published notes, when `blogEnabled`, with an alternate only when a twin exists.

Absolute URLs use `site.url`. `/ds`, 404 and `/contact/sent` are never listed.

### Robots

`src/pages/robots.txt.ts`:

```
User-agent: *
Allow: /
Disallow: /ds

Sitemap: ${site.url}/sitemap.xml
```

### Site-wide OG image and meta

- **Generic renderer.** `src/lib/og.ts` gains `renderSheetOg({ lang, sheet, meta, title, dek })`. `renderNoteOg` becomes a thin wrapper, so the note images are unchanged.
- **Site cards.** `src/pages/og/site/[lang].png.ts` renders one card per language, in the same sheet style:
  - **Sheet line:** `ui[lang].home.sheet00` (`SHEET 00 — FRANCISCO MYERS · FULLSTACK DEVELOPER`).
  - **Meta:** empty.
  - **Title:** `ui[lang].h1.home`.
  - **Dek:** `ui[lang].home.lead`.
- **`Base.astro` defaults.** `ogImage` defaults to `/og/site/{lang}.png`. Every page emits:
  - `og:title` (the full `<title>`), `og:description` (the page description, or the home lead), `og:url` (canonical), `og:site_name` `fmyers.dev`;
  - `og:type`: `article` for note and case pages (new `ogType` prop), `website` otherwise;
  - `og:locale` (`en_US` / `es_ES`) and `og:locale:alternate` when a twin exists;
  - `og:image` with its width and height;
  - `twitter:card` `summary_large_image`.

## 3. Analytics

Vercel Web Analytics with its native snippet, **no npm package**:

```html
<script>
  window.va =
    window.va ||
    function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

- **Where.** It is emitted from `HeadCommon` only when `site.analytics` is true. `site.analytics` = `process.env.VERCEL_ENV === 'production'` at build, so previews, local builds and tests never load it, and the script only exists on Vercel.
- **Privacy.** The privacy page already says "No cookies, no tracking". Vercel Web Analytics is cookieless and aggregate, so that stays true. The privacy copy is left as it is.
- **Owner action:** enable Web Analytics for the project in the Vercel dashboard (a Vercel setting, needs confirmation).

## 4. Release tagging: `Release-As`

`tag.yml`'s inline shell moves to `scripts/next-tag.mjs`: a pure `nextTag({ tags, message })` plus a tiny CLI, unit-tested.

- **Default.** It takes the highest `vMAJOR.MINOR.PATCH` tag (semver order) and bumps the minor: `v0.9.0` → `v0.10.0`, and `v1.0.0` → `v1.1.0`.
- **Override.** If the merged commit message has a line `Release-As: vX.Y.Z` (the squash body is the PR body), that version is used. It must be greater than the highest existing tag; otherwise the job fails, and no tag is ever moved.
- **Idempotent.** A HEAD that already has any `v*` tag is skipped.
- **Docs.** The CONTRIBUTING tags table is updated: the format, `Release-As`, and "`v1.0.0` via `Release-As` in the SP8b launch PR".

## 5. Quality gates

- **Lighthouse.** Run with `npx -y lighthouse` against the static build (no repo dependency), mobile and desktop presets, on:
  - `/en`
  - `/en/work`
  - `/en/work/churchapp`
  - `/en/contact`
  - `/es/precios`

  Target: **≥ 95 in Performance, Accessibility, Best Practices and SEO**. Every finding below target is fixed (with a test where it's behavioural) or ruled on in the ledger. The scores go in the PR.

- **Handoff QA checklist** (README "QA checklist"):
  - every item is checked;
  - the automated ones point at existing tests;
  - the manual ones (4× slow motion, Safari/Firefox swap) are recorded with notes or screenshots in the PR.

## Owner actions (listed in the PR)

1. Paste the new `Code.gs` and `Email.gs`, set the `REPLY_TO` script property, and deploy a new version.
2. Make sure the Turnstile widget's hostnames include the production `.vercel.app` domain.
3. Confirm the Vercel setting change (enable Web Analytics). I make it after you confirm.

## Testing

- **Unit:**
  - `next-tag` (default bump, the v0→v1 boundary, `Release-As` valid, lower, equal, malformed);
  - the sitemap builder (routes, alternates, noindex exclusions, blog on/off);
  - the remark token plugin;
  - the email guard (no address literals outside `site.ts`).
- **e2e:**
  - `sitemap.xml` parses, lists the expected URLs with alternates, and excludes `/ds` and `/contact/sent`;
  - `robots.txt` content;
  - every sampled page has `og:*`/`twitter:*` meta with absolute URLs;
  - the site OG PNGs are 1200×630;
  - the contact page, confirmation, error message and privacy page show `fmyersdev@gmail.com`;
  - no analytics script in the test build.
- **Flag off:** the check script already scans `.xml`, so the sitemap must not list notes when the blog is off.
- **Regression:** the full suite stays green.

## Out of scope

Real assets, final prices, the domain and Email Routing, and the release to `main` (SP8b). Issues #8, #9 and #11.
