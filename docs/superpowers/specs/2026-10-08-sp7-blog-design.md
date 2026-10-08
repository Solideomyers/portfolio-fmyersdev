# SP7 Blog — design

**Status:** approved in conversation 2026-10-08 · **Branch:** `feature/sp7-blog` · **Release:** v0.8.0

## Goal

Build the notes section (handoff P08 index, P09 note, the Home "Latest note" block and the `06 NOTES` nav item) with RSS and automatic OG images. Keep it **hidden by `blogEnabled`** until there are three published notes. Exit criterion (roadmap): _blog hidden by the flag; works when enabled._

Sources: `docs/handoff/README.md` (C10 nav, C15 pagination, P01, P08, P09, the `notes` content model, "Blog" decision row), `docs/handoff/design/Blog Index.dc.html` and `Blog Post.dc.html` (values and COPY, verbatim).

## Decisions (owner, 2026-10-08)

1. **Content:** N-02 ships complete in EN and ES, copied verbatim from `Blog Post.dc.html` COPY. N-01 ships as `draft: true`, with its title and dek from `Blog Index.dc.html` and no body; it isn't listed, routed or fed. No note text is written for the owner.
2. **OG images:** generated at build with **Satori + @resvg/resvg-js**, the only new dependencies (dev). Archivo and JetBrains Mono TTFs are committed under `src/assets/fonts/` (SIL OFL; licence files included).
3. **Pagination (C15):** deferred, since it only shows from 10 notes. A GitHub issue records the design (numbered 44×44 cells, `/page/2` URLs) for when the index reaches 10 notes. The index lists every published note.

## Architecture

### The flag

- **Variable:** `astro.config.mjs` adds `BLOG_ENABLED: envField.boolean({ context: 'server', access: 'public', default: false })`. `src/config/site.ts` sets `blogEnabled` from it (import from `astro:env/server`). Every consumer reads `site.blogEnabled`.
- **Turning the blog on:** set `BLOG_ENABLED=true` in Vercel (Production) and redeploy, or change the default. This is documented in `CONTRIBUTING.md`.
- **Flag off:** nothing of the blog is generated or linked.
  - Every blog route uses `getStaticPaths` and returns `[]`: index, note, RSS and OG.
  - SiteNav has no `06` item and the Home has no Latest note block.
  - The index pages use the parameter trick `src/pages/en/[notes].astro` → `{ params: { notes: 'notes' } }` and `src/pages/es/[notas].astro` → `{ params: { notas: 'notas' } }`, because a plain `index.astro` would always build.
- **Tests:**
  - **Playwright:** its `webServer` builds with `BLOG_ENABLED=true`, so the whole suite runs against the enabled site.
  - **CI `build` job:** it builds with the default (`false`) and then runs `node scripts/check-blog-hidden.mjs`. The script fails if `.vercel/output/static` contains a `notes`/`notas` page, an `rss.xml`, an OG note PNG, or any `href` to `/en/notes` or `/es/notas`.

### Content collection `notes`

`src/content/notes/{en,es}/n-NN-<slug>.mdx`, using a glob loader with `generateId` from the file path (as for `work`, so the EN and ES twins don't overwrite each other). Strict schema:

```ts
{
  id: string (/^N-\d{2}$/),
  lang: 'en' | 'es',
  slug: string (kebab-case; per language, e.g. 'one-page-spec' / 'especificacion-de-una-pagina'),
  title: string,
  dek: string,
  date: string (/^\d{4}-\d{2}-\d{2}$/),
  category: 'process' | 'automation' | 'engineering' | 'cases',
  minutes: number (int, ≥ 1),
  tags: string[],
  draft: boolean (default false),
}
```

**`src/lib/notes.ts`** (pure, unit-tested):

- `listNotes(all, lang)`: published notes for `lang`, newest first by `date` then `id`.
  - A note that exists only in the other language is included, flagged `fallback: true`, so the index shows `ONLY IN SPANISH` / `SOLO EN INGLÉS`. This is the same behaviour as the case studies.
- `notePaths(all, lang)`, `noteUrl(lang, slug)` and `twinOf(all, note)` (by `id`, other `lang`, not draft).
- `prevNext(list, id)`: chronological neighbours. There's no wrap-around: the oldest has no previous and the newest has no next.
- `dateLabel(date)` → `2026.11` (the index format from the handoff).
- `categoryLabel(category, lang)` → the COPY `cats` names.
- `categoryCounts(list)`.
- Duplicate `slug` within a language or a duplicate `id` within a language throws at build (as `casePaths` does).

### Routes and i18n

- `ROUTES.notes`: `{ en: '/en/notes', es: '/es/notas' }`. Note URLs are `${ROUTES.notes[lang]}/${slug}`.
- `NAV` gets `notes` only when `site.blogEnabled`; the nav label is `06 NOTES` / `06 NOTAS`. `navKeyOf` treats note pages as `notes`.
- The language switch on a note goes to its twin. With no twin, it goes to the other language's notes index, the same rule as `caseLinks`.
- Copy goes in `ui[lang].notes`, verbatim from the two `.dc.html` COPY objects: sheet, h1, lead, filterLabel, cats, onlyEn, emptyK, emptyH, showAll, allNotes, contents, author, write, related, prev, next, latest. `RSS ↗` comes from the index markup.

## Screens

Values (sizes, borders, gaps) come from the `.dc.html` files, as in earlier SPs.

### P08 — Notes index (`NotesIndexPage.astro`)

- **Header:** SheetHeader `SHEET 07 — NOTES` / `LÁMINA 07 — NOTAS`, with meta `RSS ↗` linking to the language feed. Then the h1 and the lead.
- **Category chips:** `All` plus 4 categories, each with its count, as `<button aria-pressed>` chips.
  - With JS, a chip shows only matching rows (`hidden`) and updates `aria-pressed`. The URL is unchanged: no routes per category.
  - Without JS the chips stay inert, all rows show, and no chip is pressed, which reflects the unfiltered state honestly.
  - Chips are min 40px tall, 44px on coarse pointers (same pattern as the contact chips).
- **Rows:** `PostRow` per note (N-ID, date, title, dek, category, minutes, fallback label).
- **Empty state** (a category with 0 notes): a dashed box with `0 NOTES`, `Nothing in this category yet.` and a `SHOW ALL NOTES` button that resets to All. This is reachable only with JS; without JS it never renders.
- `<link rel="alternate" type="application/rss+xml">` in the head.

### P09 — Note (`NotePage.astro`)

- `← ALL NOTES` (Button link).
- **Header:** `N-02 · PROCESS`, `date · 6 MIN`, h1, dek, tags as `Tag`s.
- **Body:** `Toc` (h2 entries, reused from the case page) beside `Prose`, with the N-02 body in MDX: intro, h2s, quote, code block, h3 and list, the figure placeholder and the case-study link.
  - The figure has no real image: it uses the existing `Figure` placeholder with the COPY caption `The ChurchApp spec, page one of one` and the `SCREENSHOT` label. This is a known placeholder, listed for SP8.
- **Author block:** the existing portrait placeholder, the name, the COPY author line and a `WRITE TO ME` button to the contact page.
- **Prev/next:** chronological, using the COPY `prev` and `next` labels with the neighbour titles. At the newest end it shows `This is the latest note`. With only N-02 published, both ends are empty; the rendering of this state is designed and tested.
- `noindex` stays off. Hidden-by-flag is handled by not generating the page at all.
- `ogImage` → `/og/notes/{lang}/{slug}.png`.

### Home — Latest note (`HomePage.astro`)

Only with the flag on: between Process and Contact, a SheetHeader `SHEET 07 — NOTES` with meta `ALL NOTES →`, then one `PostRow` for the newest note in the page's language (with fallback). The handoff has no copy for this block beyond these existing strings, so none is invented.

### Nav (`SiteNav.astro`)

With the flag on, `06 NOTES` / `06 NOTAS` goes after CONTACT on desktop and in the mobile menu, with `aria-current` on notes pages. It must still fit on one line at 1200px; this is verified by screenshot and `overflow.spec`.

## RSS

- `src/pages/en/notes/[feed].ts` and `src/pages/es/notas/[feed].ts`, with `getStaticPaths` → `{ feed: 'rss.xml' }` when enabled.
- A hand-written RSS 2.0 string (no dependency). Channel: title `fmyers.dev — Notes` / `fmyers.dev — Notas`, link, description (the COPY lead), language.
- Items: the published notes of that language (no fallbacks), with title, link (absolute, `site.url`), guid (permalink), `pubDate` (RFC 822) and description (dek). Everything is XML-escaped.
- `Content-Type: application/rss+xml; charset=utf-8`.

## OG images

- `src/pages/og/notes/[lang]/[slug].png.ts` (`getStaticPaths` per published note and language, `[]` when off) returns a PNG.
- `src/lib/og.ts`: `renderNoteOg({ id, category, title, dek, lang }) → Promise<Uint8Array>`. It builds a Satori element tree (a plain object, so no React), renders it to SVG, then to PNG with resvg. Fonts are read from `src/assets/fonts/*.ttf`: **static** instances `Archivo-Regular.ttf`, `Archivo-Bold.ttf` and `JetBrainsMono-Medium.ttf`, because Satori doesn't support variable fonts. The image uses literal hex values: the token rule applies to CSS, and these values are the light-theme tokens.
- **Design**, 1200×630, light only, sheet style, tokens as literal hex:
  - paper `#F2F3EF` background, with 56px padding to a 2px ink `#15181C` frame;
  - top row: JetBrains Mono 22px, letter-spacing 2px, `SHEET 07 — NOTES · N-02` (or `LÁMINA 07 — NOTAS`) on the left and the category on the right, over a 1px ink rule;
  - the title in Archivo 700, 64px, line-height 1.0, letter-spacing −0.03em, ink, max 3 lines;
  - the dek in Archivo 400, 28px, graphite `#5B626A`, max 2 lines;
  - bottom left: the wordmark `fmyers.dev`, Archivo 700, 28px;
  - bottom right: a 40×40 cobalt `#2B55C8` corner square flush with the frame corner.
- `Base.astro` gets `ogImage?: string`. When it's set, it emits `og:image` (absolute), `og:image:width/height` and `twitter:card=summary_large_image`. The site-wide OG for the other pages is SP8.

## Testing

- **Unit (`tests/notes-unit.spec.ts`):**
  - `listNotes` ordering, drafts excluded and the fallback flag;
  - `prevNext` at both ends;
  - `dateLabel`, `categoryCounts`, `twinOf`;
  - the duplicate-slug throw;
  - the RSS builder: escaping and RFC 822 dates.
- **Content (`tests/notes-content.spec.ts`):** N-02 EN and ES parse against the schema, and their titles and deks equal the handoff COPY.
- **e2e (`tests/notes.spec.ts`, flag on):**
  - **Index (EN/ES):** sheet, h1, the RSS link and `<link rel=alternate>`, chip counts (All = 1, Process = 1), rows.
  - **Chips:** filtering, `aria-pressed`, the empty state and the `SHOW ALL NOTES` reset; with JS off all rows show and nothing is pressed.
  - **Note page:** header, tags, TOC entries equal to the h2s, the author block link to contact, the empty prev/next state, the language switch to the twin, and `og:image`.
  - **Feeds:** each RSS parses as XML (`DOMParser`), with one item whose link is absolute.
  - **OG PNG:** 200 OK, `image/png`, PNG signature and IHDR 1200×630.
  - **Home Latest note** present.
  - **Nav:** `06 NOTES` with `aria-current` on notes pages.
- **Flag off:** `scripts/check-blog-hidden.mjs` runs in CI after the default build; a unit test runs it against a fixture directory.
- **Regression:** the existing suite stays green with the flag on. Nav-count expectations become flag-aware.
- **Manual QA:** screenshots of index and note at 1280 light, 375 dark, ES at 768; the OG PNG viewed; the nav at 1200 on one line.

## Out of scope

Pagination (issue), site-wide OG, sitemap, writing N-01 or N-03, comments (handoff: none), search, per-category routes.
