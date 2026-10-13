# SP4 — Home & About (vertical slice) · Design

Date: 2026-10-07 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp4-home`

## Goal

Home (P01), About (P06) and Privacy (P11), with values and copy ported verbatim from `docs/handoff/design/Home.dc.html`, `About.dc.html` and `Privacy.dc.html`. Home reuses the SP2/SP3 components and data: featured cases, packages, statuses.

## Decisions (approved in brainstorming)

- **Home has its own shorter copy.** Package teasers get a new `teaser: string[]` field in each pricing file (still the single source for prices). Home's process copy (`1 WK`, shorter descriptions) lives in `ui.home.process`.
- **Key/value facts** (Home hero) become the `rows` variant of `SpecGrid`, i.e. the pending SpecTable key/value rows (C05).
- **Availability = option A.**
  - At build time, `site.availableFrom` (`YYYY-MM`) renders `Available for new projects from Nov 2026` / `Disponible para nuevos proyectos desde nov 2026`, or the dateless sentence if the build is already past that month.
  - A tiny inline script switches to the dateless sentence when the visitor's clock is past the date.
  - Without JS, the build-time text stays.
- Out of scope:
  - Hero signature draw (D03), live ruler (D13), crosshair (D14): SP6.
  - "Latest note" block: SP7 (hidden while `blogEnabled` is false).
  - Real portrait photo: placeholder hatch until `src/assets/portrait.jpg` exists (handoff).

## Content

- `pricing` schema gains `teaser: z.array(z.string()).min(1)`. Values are verbatim from Home `packages[].inc`:
  - EN P-01 `One-page spec` · `Web app + API + database` · `Deploy and 30 days of fixes`
  - EN P-02 `On your Google Workspace` · `Reports, alerts and workflows` · `No server costs`
  - EN P-03 `~20 h a week` · `Joins your team` · `Weekly report`
  - ES P-01 `Especificación de una página` · `App web + API + base de datos` · `Despliegue y 30 días de correcciones`
  - ES P-02 `Sobre tu Google Workspace` · `Reportes, alertas y flujos` · `Sin costos de servidor`
  - ES P-03 `~20 h por semana` · `Se integra a tu equipo` · `Reporte semanal`
- **`pages` collection** (new): `glob` over `src/content/pages/**/*.md`, id from the path (`en/privacy`), schema `{ title, updated: z.coerce.date() }`, with `lang` taken from the id prefix. The handoff `content/pages/{en,es}/privacy.md` drafts are copied unchanged.
- **Copy** in `ui[lang].home`, `.about` and `.privacy`, verbatim from the three `COPY` objects:
  - `home`: sheet labels, lead, `see`, `allWork`, `pricing`, `servicesH`, `ngo`, `steps`, `contactH`, `contactP`, `available`/`availableNow`, `facts[]`, `process[]`
  - `about`: sheet, role, portrait, timelineH, ctaH, work, bio[2], facts[4], timeline[6], stack[6]
  - `privacy`: sheet, updated, intro, email
  - The dateless availability sentence is not in the handoff. The wording is `Available for new projects` / `Disponible para nuevos proyectos` (README C06 / P01: "once the date has passed, show 'Available for new projects'").

## Helpers — `src/lib/home.ts` (unit-tested)

- `availability(from: 'YYYY-MM', now: Date, lang)`: `{ text, dated: boolean }`. The date has passed once `now` is on or after the first day of that month (UTC). "Available from Nov 2026" means from Nov 1, so from then on the dateless sentence shows. The month comes from `ui.months`: lowercased in ES (`nov 2026`), title-cased in EN (`Nov 2026`), matching the handoff copy. A malformed value throws.
- `featuredCases(entries, lang)`: own-language, non-draft entries with `featured: true`, sorted by `order` ascending, at most 3.

## Components

Values come from the `.dc.html` files.

| File                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SpecGrid.astro` (+ `rows`)       | Wrapper: 1px ink border, `--surface`. Each row: grid `120px minmax(0,1fr)`, rule bottom, min-height 52. Key: rule right, padding 0×12, mono 11 ls 1 muted, centered vertically. Value: padding 10×14, 16px. An optional `accent` flag per row makes the value 600 in `--accent` (STACK row).                                                                                                                                                                                                                                                                                   |
| `HeroSheet.astro`                 | `--border-frame`, relative. Ruler: height 32, rule bottom, 8 equal columns with a rule right each, mono 12, centered, zone 1 accent and the rest muted. Body: grid `auto-fit minmax(min(100%,440px),1fr)`, gap 32×48, padding `clamp(24px,4cqi,48px)`, align end. Left column (gap 20): sheet00 (mono 13 ls 1.5 accent), h1 Display XL `clamp(40px,6.6cqi,84px)`, lead (max 560), availability line (10px `--ok` dot + 16px text, gap 10, `data-available-from`), primary `Start a project →` + secondary `See work`. Right column: `SpecGrid variant="rows"`. Corner mark 28. |
| `PackageCard.astro` (+ `compact`) | Cells inside a grid with 1px gaps (no own border). Padding 24, gap 14. Background `--surface` when featured, else `--bg`. ID/badge row. Name 700 stretch 110% 24 lh 1.1. Price row: dashed bottom, padding-bottom 8, `FROM` + 32px 700 ls −0.5 + unit. Teaser list gap 8, 15px, `—` muted with gap 10. No button, no corner.                                                                                                                                                                                                                                                   |
| `ProcessGrid.astro`               | Grid `auto-fit minmax(min(100%,240px),1fr)`, 1px gap over `--line`, 1px ink border. Cells `--surface` padding 20, gap 10. Top row (mono 12 ls 1): n accent, time muted. Title 700 stretch 110% 22. Description 15/1.5 muted.                                                                                                                                                                                                                                                                                                                                                   |
| `ContactBlock.astro`              | `--invert-bg` / `--invert-fg`, relative, padding `clamp(28px,5cqi,64px)`, grid `auto-fit minmax(min(100%,420px),1fr)`, gap 32, align end. Left (gap 14): sheet04 (mono 13 ls 1.5, opacity .85), h2 Display L `clamp(32px,4.1cqi,52px)`, p 17/1.5 opacity .85, max 480. Right (gap 14, align start): primary button; links row gap 20, mono 13 ls 1: `WHATSAPP ↗` (`wa.me`) and `HOLA@FMYERS.DEV` (`mailto:`), `--invert-fg` underlined. Corner 28 at `right:0;bottom:0` (inside, since there's no frame).                                                                      |
| `Timeline.astro`                  | Rows: flex wrap, gap 4×32, padding 18×0, rule bottom. Year: `flex:0 0 160px`, mono 13 ls 1, accent for the first 2 rows (current), else muted. Body (flex 1 1 300px, gap 4): title 700 stretch 110% `clamp(19px,1.8cqi,22px)`, description 15/1.5 muted.                                                                                                                                                                                                                                                                                                                       |
| `Portrait.astro`                  | Figure: flex 1 1 260px, max 420, gap 8. Frame 4:5 `--border-frame`, hatch with label `PORTRAIT · B&W · 4:5`, or the image when `src/assets/portrait.jpg` exists (`astro:assets`, grayscale source expected). Corner 28. Caption `FIG. 1` accent + `FRANCISCO MYERS · CIUDAD GUAYANA`.                                                                                                                                                                                                                                                                                          |
| `Prose.astro` (+ `page`)          | Privacy variant: h2 `clamp(21px,2cqi,24px)` ls −0.3; each h2 starts a section with a rule top, padding-top 18, margin-top 18; paragraph 17/1.65; section gap 8 (number via the existing counter).                                                                                                                                                                                                                                                                                                                                                                              |

## Pages

**HomePage** (main gap `clamp(56px,8cqi,96px)`, a larger gap than inner pages):

1. HeroSheet.
2. Work section (gap 24): SheetHeader `SHEET 01 — SELECTED WORK` with meta link `ALL WORK →` (accent) → work. Card grid as in P10 with `featuredCases`.
3. Services section (gap 24): SheetHeader `SHEET 02 — SERVICES` / `PRICING DETAILS →` → pricing. h2 Display L, max 820. Grid `auto-fit minmax(min(100%,220px),1fr)`, 1px gap over `--line`, ink border, of `PackageCard compact`. NGO line 15 muted.
4. Process section (gap 24): SheetHeader `SHEET 03 — PROCESS` / `04 STEPS`, then ProcessGrid.
5. ContactBlock.

**AboutPage**:

1. Intro (gap 24): SheetHeader `SHEET 03 — ABOUT` / `REV {site.rev}`. Below it, a flex wrap row (gap 32×64, align start):
   - Portrait.
   - Text column (flex 1.6 1 380px, gap 20): role (mono 13 ls 1.5 accent), h1 Page H1, 2 bio paragraphs (`clamp(17px,1.5cqi,19px)`/1.55, max 640), and facts as `SpecGrid` cells with min 170, max 640.
2. Timeline section (gap 20): SheetHeader `TIMELINE` / `2018 — 2026`, then Timeline.
3. Stack section (gap 20): SheetHeader `STACK` / `06`, then `SpecGrid` cells with min 260, padding 16, value 16/1.4.
4. CtaRow `Let's build the next one.` with secondary `See work` → work.

**PrivacyPage** (main gap 24):

1. SheetHeader `SHEET 08 — PRIVACY` / `UPDATED 2026-10-06`.
2. Article (max 680, gap 18): h1 = entry `title` (Page H1), intro = the first paragraph of the body (lead, muted), then `Prose variant="page"` with the rest.
3. Mail button `HOLA@FMYERS.DEV →`: mono 13 ls 1, 1px ink, `--text`, padding 14×16, hover accent.

The body's first paragraph is the intro. The handoff `COPY.intro` equals the draft's first paragraph, so the page renders the body as-is and styles `p:first-child` as the lead, with no duplicate copy.

## Error handling

- Missing `pages` entry for a language: the build throws (`getEntry` undefined).
- `availableFrom` not matching `YYYY-MM`: the build throws (validated in `availability`).
- Fewer than 3 featured cases is fine; 0 hides the section.

## Testing

- **Unit** (`tests/home-unit.spec.ts`):
  - `availability` before, during and after the month, for EN/ES text and the `dated` flag.
  - `featuredCases`: order, cap at 3, language, drafts and non-featured excluded.
- **e2e** (`tests/home.spec.ts`), EN and ES:
  - **Home:**
    - Ruler has 8 zones, zone 1 accent; h1; availability text; 4 facts with STACK in accent.
    - Cards FM-01 then FM-02.
    - 3 compact packages (featured on `--surface`, prices).
    - 4 process cells.
    - Contact block on `--invert-bg` with a `wa.me` and a `mailto:` link.
  - **Availability after the date:** Playwright `page.clock.setFixedTime('2026-12-01')` gives the dateless sentence; before the date, the dated one.
  - **About:** portrait hatch + caption; 2 bio paragraphs; 4 facts; 6 timeline rows with the first 2 accent; 6 stack cells; CTA hrefs.
  - **Privacy:** h1, updated date, 7 numbered h2 sections, the mailto button.
  - `routes.spec.ts`, `overflow.spec.ts` and the heading-order check cover the three pages.
- `/ds`: specimens for HeroSheet, compact PackageCard, ProcessGrid, ContactBlock, Timeline, Portrait, SpecGrid rows.

## Done when

All tests pass locally and in CI, the Vercel preview shows the three pages, and screenshots at 1280/768/375 (light and dark) match the `.dc.html` files. Roadmap SP4 done.
