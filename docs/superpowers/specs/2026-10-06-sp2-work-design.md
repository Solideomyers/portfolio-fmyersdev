# SP2 — Work (vertical slice) · Design

Date: 2026-10-06 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp2-work`

## Goal

The two work screens, built with the components and content they need: Work index (P10) and Case study (P02), from the `work` and `otherWork` collections. Components are ported value for value from `docs/handoff/design/Work Index.dc.html` and `Case Study.dc.html`, and shown on an unlisted `/ds` specimen page.

## Decisions (approved in brainstorming)

- **Vertical slices** replace "components then screens". SP2 = Work, SP3 = Offer (Home, Services, Pricing, About, Privacy). The roadmap is updated in this PR.
- **Case studies are MDX** (`@astrojs/mdx`, planned anyway for the blog), so authors place `<Figure>` and `<Metrics>` inside the right section.
- Out of scope:
  - Pagination (C15) and the sector filter: shown only from 10 items or 6 projects.
  - Button secondary variant and SpecTable key/value rows: SP3.
  - Card → case morph (`transition:name`) and scroll reveal: SP5.
  - FAQ, pages and pricing collections: SP3.
- Specimens live at `/ds` (Astro does not route files starting with `_`), `noindex`, not linked.

## Content

`docs/handoff/content/work/**` and `other-work.json` are copied to `src/content/`. Case files are renamed `.md` → `.mdx`, and two inline elements are added:

- In **Solution**, `<Figure shot={frontmatter.shots[1]} n={2} />` (renders nothing when the shot doesn't exist).
- At the end of **Outcome**, `<Metrics />` (reads `frontmatter.metrics`, renders nothing when empty).

`src/content.config.ts`:

- **work**: `glob({ base: './src/content/work', pattern: '**/*.mdx' })`. The schema is the handoff's verbatim: `id` matches `^FM-\d{2}$`, `slug`, `lang`, title, summary, client, `sector[]`, `modules[]`, `stack[]`, `status: live|in-use|wip`, optional `version`, role, timeline, year, `cover{src,alt}`, `shots[{src,alt,caption}]`, `metrics[{label,value,date}]` default `[]`, `featured` default `false`, `order` default `99`, `draft` default `false`.
- **otherWork**: `file('src/content/other-work.json')`. Items are `{ id: ^OW-\d{2}$, title, repo: url, stack[], en, es }`.

**Images.** `Figure` resolves a content path (`/work/fm-02/chapel.png`) against `src/assets/work/**` via `import.meta.glob` and renders `astro:assets` `<Image>`. If the file doesn't exist it renders the hatch placeholder (`SCREENSHOT · 16:10` / `CAPTURA · 16:10`).

- `chapel.png` is copied from `Solideomyers/Solideomyers/assets/shots/chapel.png`.
- ChurchApp stays hatched; the handoff says its shots must be recaptured with sample data.

## Pure helpers — `src/lib/work.ts` (unit-tested)

- `listCases(entries, lang)`: entries for that language plus entries that exist only in the other language (marked `fallback: true`). No drafts. Sorted by FM-ID descending.
- `nextCase(list, id)`: the next **higher** FM-ID, wrapping to the lowest (FM-01 → FM-02 → FM-01). Returns `{ entry, index, total }`, where `index` is the next case's 1-based position in ascending FM-ID order (the `02 / 02` meta).
- `twinOf(entries, entry)`: the same `id` in the other language, or `undefined`.
- `caseUrl(lang, slug)`: `/en/work/{slug}` | `/es/proyectos/{slug}`. `ROUTES.work` is the prefix source.
- `statusLabel(status, lang)`: `live → LIVE/EN VIVO`, `in-use → IN USE/EN USO`, `wip → PILOT/PILOTO`.
- `asOf(metrics, lang)`: the latest `date` → `AS OF OCT 2026` / `DATOS A OCT 2026`.

## Routes

- `src/pages/en/work/[slug].astro`, `src/pages/es/proyectos/[slug].astro`: thin wrappers.
  - `getStaticPaths` covers every slug of `listCases(all, lang)` plus drafts (a draft's URL still builds).
  - They render `CasePage` with `alternate = twin ? caseUrl(otherLang, twin.slug) : null`.
- The `/en/work` and `/es/proyectos` stubs are replaced by `WorkIndexPage`.
- Fallback entries (only in the other language) render that language's content. `<html lang>` stays the route's language (nav and footer copy) and the content wrapper gets `lang` = content language. A tag above the title reads `ONLY IN ENGLISH` / `SOLO EN ESPAÑOL` (written in the content's language; mono 12, 1px ink, padding 6×10).

## Components (values from the `.dc.html` files)

| ID  | File                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | `Button.astro`      | `variant: primary \| link`. Primary: 17px/600, accent bg, `--accent-fg`, padding 16×24, nowrap, `→` suffix when `arrow`. Link: mono 13, ls 1px, accent, `→`/`↗`/`←` glyph. Press `scale(.97)` 160ms via the existing `[data-press]` rule in `motion.css`.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C04 | `SheetHeader.astro` | flex space-between, wrap, gap 12, mono 13, ls 1px, `border-bottom: var(--border-ink)`, padding-bottom 10. Slots: default (left), `meta` (right, muted).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| C05 | `SpecGrid.astro`    | grid `repeat(auto-fit,minmax(min(100%,{min}px),1fr))`, gap 1px over `--line`, cells `--surface`, padding 12×16 (case) or 10×16 + border-bottom rule (card 2×2), key mono 11 ls 1 muted, value 15/1.4. Rows with an empty value are omitted.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| C06 | `Status.astro`      | Dot 8px: live = filled `--ok`; in-use = ring (`1.5px solid --ok`, transparent fill); wip = dashed ring. Always followed by its label. Variants: `badge` (card: mono 12, 1px ink, padding 4×8) and `inline` (sheet header, muted). The dot never animates.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C07 | `Tag.astro`         | mono 12, 1px ink, padding 6×10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| C08 | `ProjectCard.astro` | `variant: grid \| next`. **grid**: 1px ink on `--surface`; header row padding 12×16 (FM-ID accent + Status badge); 16:10 Figure (no frame/caption); body padding 20×16, title `clamp(28px,2.7cqi,34px)` 700 stretch 110% ls −1px, summary 16/1.45; 2×2 SpecGrid (SECTOR, STACK = first two stack items, ROLE, YEAR); footer `READ CASE →` mono 13 accent, `margin-top:auto`. Hover (fine pointer): border → accent, 200ms. **next**: grid `repeat(auto-fit,minmax(min(100%,300px),1fr))`, image left, body padding 24 with `border-left` rule, FM-ID + status text, title 34px, summary, `READ CASE →`. The whole card is one `<a>`.                                                     |
| C12 | `Figure.astro`      | props `{ shot?: {src,alt,caption}, n?: number, frame?: boolean = true, ratio = '16/10' }`. 1px ink frame, image or hatch (`repeating-linear-gradient(135deg,var(--hatch) 0 1px,transparent 1px 10px)`), caption row gap 12, mono 12 ls 1 muted, `FIG. N` accent `flex:none`. Lazy-loads except FIG. 1.                                                                                                                                                                                                                                                                                                                                                                                   |
| C13 | `PostRow.astro`     | grid `96px minmax(0,1fr) auto`, gap 8×16, padding 16×0, border-bottom rule. Meta mono 12 muted. Title stretch 110% 700 `clamp(19px,1.8cqi,22px)`, dek 15/1.45 muted, stack mono 12 muted. Right side `REPO ↗` mono 13 accent. Hover: text → accent. External link `rel="noopener"`.                                                                                                                                                                                                                                                                                                                                                                                                      |
| C14 | `Prose.astro`       | Wraps MDX content. Max 680. Sections are separated by `gap: clamp(36px,4cqi,48px)` (via `h2` margin-top). `h2` 700 stretch 110% `clamp(24px,2.2cqi,28px)` ls −0.5px, preceded by a CSS-counter number (`01`, mono 12 accent, gap 12, baseline). `p` 17/1.6. `ul` → grid `20px minmax(0,1fr)` with a mono muted `—` marker, 17/1.55, gap 10. `strong` 600. `blockquote`: 2px ink left border, 19–22px. `code`: mono 14 on `--surface` with 1px rule, horizontal scroll.                                                                                                                                                                                                                   |
| C17 | `Toc.astro`         | Only with ≥ 3 h2. **Desktop ≥ 1200px**: `<nav aria-label>` sticky `top:88px`, `flex:0 0 240px`, label mono 12, list with 1px left rule, 2px × 36px accent marker (`transform`, 200ms `--ease-in-out`), rows 36px, number mono 11 muted + label 15px. Active row `--text` 600, others muted 400. **Below 1200px**: a block with a 1px ink border holding a button (min-height 48, mono 13, `CONTENTS · 03/05 Constraints`, `+` rotates 45° when open, `aria-expanded`) and rows of 44px. Picking a row closes it. Active index comes from IntersectionObserver `rootMargin: -30% 0px -60% 0px`; the active link has `aria-current="location"`. No JS: all links visible and anchors work. |
| —   | `Metrics.astro`     | grid `repeat(auto-fit,minmax(min(100%,150px),1fr))`, gap 1px over `--line`, 1px ink border, cells `--surface` padding 16, value 36px 700 stretch 110% ls −1px lh 1, label 14/1.35 muted. Under it, `asOf` mono 11 muted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| —   | `CtaRow.astro`      | `border-top: var(--border-frame)`, padding-top 24, flex space-between wrap gap 20. Heading 700 stretch 110% `clamp(26px,2.7cqi,34px)` ls −0.5px. Primary Button → contact.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

The global `a` style from SP1 stays. Cards and rows set their own colours.

## Pages

**WorkIndexPage** (P10). Main gap `clamp(48px,7cqi,80px)`:

1. **Header** (gap 16): SheetHeader `SHEET 01 — WORK` / count meta `02 CASE STUDIES · 03 REPOS` (zero-padded, computed); h1 Page H1 (`max-width:900px`); lead `clamp(17px,1.5cqi,19px)`/1.45 muted, max 640.
2. **Cases**: grid `repeat(auto-fit,minmax(min(100%,330px),1fr))` gap 24 of ProjectCard `grid`.
3. **Other work**: SheetHeader `OTHER WORK` / `OPEN SOURCE · GITHUB`, then PostRows (`OW-NN`, title, `en|es` line, stack joined `·`).
4. **CtaRow**: `Want yours on this sheet?` / `¿Quieres el tuyo en esta lámina?`.

**CasePage** (P02). Main padding top `clamp(20px,3cqi,32px)`, gap `clamp(40px,6cqi,72px)`:

1. **Header group** (gap 16):
   - `← ALL WORK` link (mono 13, min-height 32).
   - SheetHeader `FM-NN — CASE STUDY` with meta Status inline + `· version`.
   - The frame section: 2px frame on `--bg`, padding `clamp(24px,4cqi,48px)`, gap 16. Inside:
     - Fallback tag, when applicable.
     - h1 Display XL `clamp(44px,6.6cqi,84px)` lh .95.
     - Summary, max 680.
     - `client · role · timeline` (mono 12 ls 1 muted, uppercase, gap 6×20).
   - Below the frame: SpecGrid min 160 with an ink top border: SECTOR, MODULES, STACK (joined `·`), STATUS (label + `· version`).
   - Corner mark 28px.
2. **FIG. 1**: `shots[0]`.
3. **Body**: flex, gap 64. Toc + `<article>` (flex 1, min-width 0, max 680) with Prose(Content). Below 1200px it switches to column direction with the TOC block on top.
4. **Next**: SheetHeader `NEXT PROJECT` / `02 / 02`, then ProjectCard `next`.
5. **CtaRow**: `Want something similar?` / `¿Quieres algo parecido?`.

Copy lives in `ui[lang].work` / `ui[lang].case` and is verbatim from the two `COPY` objects:

- `sheet`, `countCases`, `countRepos`, `h1`, `lead`, `shot`, `readCaps`, `otherH`, `otherNote`, `ctaH`
- `allWork`, `caseStudy`, `contents`, `next`, `similar`, `onlyIn`, `start`

## `/ds` (specimens)

`src/pages/ds.astro`: `noindex`, EN, every SP2 component with its variants (Status ×3, Tag, Button ×2, SheetHeader, SpecGrid, Figure image + hatch, ProjectCard ×2, PostRow, Metrics, CtaRow, Prose sample, Toc). It is not in `ROUTES` and not linked.

## Error handling

- Invalid frontmatter fails the build (Zod). That's intended: a bad project file must not deploy.
- A missing image renders the hatch instead of failing.
- An empty `metrics` renders nothing, and so does a missing `shots[1]`.
- A twin missing in one language gives the fallback page plus `alternate = null`, so the LangSwitch cell is disabled.

## Testing

- **Unit** (`tests/work-unit.spec.ts`, fake entries): sorting desc, drafts excluded, fallback marking, `nextCase` wrap and `index/total`, `twinOf`, `caseUrl`, `statusLabel`, `asOf` formatting.
- **e2e** (`tests/work.spec.ts`):
  - **Index EN/ES**:
    - Count meta and cards in FM-02, FM-01 order, each linking to its case.
    - 3 other-work rows with `REPO ↗` links to github.
    - CTA to contact.
  - **Case EN/ES × 2**:
    - h1, sheet meta status, and the spec grid has 4 cells (none empty).
    - FIG. 1 present. Chapel shows an `<img>`; ChurchApp shows the hatch.
    - FIG. 2 sits inside the Solution section (when the shot exists).
    - Metrics plus AS OF sit inside Outcome.
    - The next card links to the wrap-around case.
    - The ES twin link is correct.
  - **TOC**:
    - Desktop: 5 links to existing ids; scrolling to Outcome sets `aria-current="location"` on it.
    - 768: collapsed with `aria-expanded=false`; opening, picking a row, then closed and scrolled.
    - No JS: links visible.
- `overflow.spec.ts` gains the work and case routes.
- `routes.spec.ts` is unchanged; the work stub test now asserts the real h1 (same copy).

## Done when

All tests pass locally and in CI, the Vercel preview shows both screens, and `/ds` renders. Manual check of the preview at 1280/768/375 in EN/ES, light and dark, against the two `.dc.html` files. Roadmap updated (SP2 Work, SP3 Offer).
