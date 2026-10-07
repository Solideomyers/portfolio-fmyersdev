# SP3 — Offer (vertical slice) · Design

Date: 2026-10-07 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp3-offer`

## Goal

Services (P03) and Pricing (P04), built with the components and content they need. Values and copy are ported verbatim from `docs/handoff/design/Services.dc.html` and `Pricing.dc.html`. Packages and FAQ come from content collections, so prices (placeholders per the handoff) change in one place.

## Decisions (approved in brainstorming)

- The old "SP3 Offer" splits into two slices. **SP3 Offer** = Services + Pricing. **SP4 Home & About** = Home, About, Privacy. The old SP4–SP7 become SP5–SP8 (Contact, Motion, Blog, Launch). The roadmap is updated in this PR.
- **FAQ follows the design:** Services shows 4 (Q-07…Q-10) and Pricing shows 6 (Q-01…Q-06). In the copied data, Q-02 and Q-05 change from `page: "both"` to `page: "pricing"`. `both` stays supported by the filter.
- FAQ uses **native `<details>`** (README C16), not the design prototype's buttons. Several items can be open at once; the first starts open.
- Out of scope:
  - PackageCard compact variant and SpecTable key/value rows: SP4 (Home).
  - FAQ answer fade (D17) and press/hover motion beyond CSS transitions already in tokens: SP6.

## Content

### `pricing` collection

`src/content/pricing/{en,es}/p-01-saas-mvp.md`, `p-02-automation.md`, `p-03-fullstack.md`. Frontmatter only. Loader: `glob`, id from the file path (as in SP2).

```ts
z.object({
  id: z.string().regex(/^P-\d{2}$/),
  lang: z.enum(['en', 'es']),
  order: z.number(),
  name: z.string(),
  for: z.string(), // Pricing card line
  from: z.number().int().positive(), // USD
  billing: z.enum(['project', 'month']),
  includes: z.array(z.string()), // Pricing card list
  timeline: z.string(), // "4–6 weeks" / "Monthly" (uppercased by CSS where the design is caps)
  featured: z.boolean().default(false),
  service: z.object({
    for: z.string(), // Services sheet line (longer than the card's)
    scope: z.array(z.string()), // WHAT I DO
    deliver: z.array(z.string()), // WHAT YOU GET
    stack: z.array(z.string()),
    proof: z.string(),
  }),
  compare: z.object({
    timeline: z.string(),
    spec: z.string(),
    weeklyBuilds: z.string(),
    ownership: z.string(),
    fixes: z.string(),
    maintenance: z.string(),
    payment: z.string(),
  }),
});
```

These extend the README's pricing model (`id, name, for, from, unit, includes[], timeline, featured`) with what the two screens show. `unit` becomes `billing`, and the label comes from `ui`. Values are verbatim from the `pk`, `sv` and `rows` arrays of the two `COPY` objects:

- P-01 SaaS MVP, $4,500, project, 4–6 weeks, featured
- P-02 Automation, $900, project, 1–2 weeks
- P-03 Fullstack contract, $2,800, month, Monthly

### `faq` collection

The handoff `content/faq/{en,es}.json` is copied to `src/content/faq/` with the Q-02/Q-05 change. An inline loader reads both files and returns entries with `id: "{lang}/{Q-NN}"` and `lang`. Schema: `{ qid: /^Q-\d{2}$/, lang, page: 'pricing'|'services'|'both', order, q, a }`. The JSON key `id` is renamed to `qid` by the loader.

## Helpers — `src/lib/offer.ts` (unit-tested)

- `formatUsd(n)`: `4500 → "$4,500"` (`Intl.NumberFormat('en-US')`, no decimals; the design uses `$4,500` in both languages).
- `priceShort(pkg, lang)`: `"$900"` / `"$2,800 / mo"` / `"$2,800 / mes"`, for the Services FROM cell.
- `unitLabel(billing, lang)`: `PER PROJECT` / `PER MONTH` / `POR PROYECTO` / `AL MES`.
- `faqFor(entries, page, lang)`: entries whose `page` is `page` or `both`, in that language, sorted by `order`.
- `byOrder(list)`: sorts packages by `order`.

## Components

Values come from the two `.dc.html` files.

| ID  | File                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C09 | `PackageCard.astro`  | `{ pkg, lang }`. Featured: `--border-frame`, `--surface`, primary button, 20px corner mark. Otherwise: `--border-ink`, `--bg`, transparent button with ink border and `--text`. Header row padding 12×20, rule bottom, mono 13: ID in accent and, when featured, the badge `MOST CHOSEN` (mono 11, ls 1, invert, padding 3×6). Body padding 24×20, gap 16, flex 1. Name 700 stretch 110% 28 lh 1.05; for 15/1.45 muted. Price row: baseline, gap 10, wrap, `1px dashed --text-muted` bottom, padding-bottom 10; `FROM` mono 12 muted; price 700 stretch 110% 44 ls −1 lh 1; unit mono 12 muted. Includes: grid `18px 1fr` gap 6, 15/1.4, `—` mono muted, list gap 10. Timeline: mono 12 ls 1 muted, uppercase, `margin-top:auto`, padding-top 8. Button: 16/600, centered, padding 14×20, 1px ink border, `Start with this →`, links to contact. |
| —   | `ServiceSheet.astro` | `{ pkg, lang }`. Section: `--surface`, flex wrap. Border is `--border-frame` when featured, else `--border-ink`; 20px corner mark when featured. **Left** (flex 1 1 300px, padding `clamp(20px,3cqi,32px)`, gap 14, rule right): ID/badge row; h2 700 stretch 110% `clamp(28px,3cqi,38px)` ls −0.5 lh 1.05; `service.for` 16/1.5 muted; a 2-cell box (1px rule, `--bg`): FROM (`priceShort`, 700 20) / TYPICAL TIMELINE (15); `SEE PRICING →` mono 13 accent, `margin-top:auto` → pricing. **Right** (flex 2 1 420px, same padding, gap 20): grid `auto-fit minmax(min(100%,220px),1fr)` gap 20×32 of WHAT I DO (`—` muted) and WHAT YOU GET (`✓` in `--ok`), items 15/1.45 with an 18px marker column. Then stack Tags (padding-top 16, rule top, gap 8) and the proof line (14 muted).                                                         |
| —   | `ProcessRows.astro`  | `{ lang }`. SheetHeader `HOW A PROJECT RUNS` / `04`. Rows have an ink top border on the list, each row: flex wrap, gap 6×24, padding 16×0, rule bottom, baseline. Columns: (n mono 12 accent + title 700 stretch 110% 22, flex 1 1 200px, gap 14), (time mono 12 ls 1 muted, flex 0 1 140px), (description 15/1.5, flex 2 1 320px).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| —   | `CompareTable.astro` | `{ packages, lang }`. SheetHeader `COMPARE` / `SWIPE →` (meta shown only below 620px). Scroller `overflow-x:auto`, `tabindex="0"`, `role="region"`, `aria-label`. Grid `min-width:620px`, `minmax(150px,1.2fr) repeat(3,minmax(0,1fr))`, 1px ink border, 1px gap over `--line`. Head cells on `--surface` padding 12×14 (empty corner; ID mono 11 accent + name 700 15); body cells on `--bg` padding 12×14: key mono 11 ls 1 muted, value 15/1.35. Rows: TIMELINE, SPEC, WEEKLY BUILDS, CODE OWNERSHIP, FIXES AFTER LAUNCH, MAINTENANCE PLAN, PAYMENT (ES labels from `COPY`). Semantic table roles: `role="table"`/`row`/`columnheader`/`rowheader`/`cell`.                                                                                                                                                                                    |
| C16 | `Faq.astro`          | `{ items, lang, heading, intro? }`. Section: flex wrap, gap 24×64, align start. **Left** (flex 1 1 280px, gap 12): `FAQ · 0N` mono 13; h2 700 stretch 110% `clamp(32px,4.1cqi,52px)` ls −0.03em lh 1 balance; optional intro 16/1.5 muted. **Right** (flex 2 1 460px, min-width 0, ink top border): one `<details>` per item (first `open`), rule bottom. `<summary>`: grid `44px minmax(0,1fr) 24px`, gap 8, baseline, min-height 52, padding 14×0, no marker. Parts: qid mono 12 ls 1 muted; question 600 17; `+` mono 20 lh 1 justify-end, rotating 45° when open (200ms `--ease-out`; none under reduced motion). Answer: padding `0 32px 16px 52px`, 15/1.55 muted. Summary hover (fine pointer): accent. Emits `<script type="application/ld+json">` FAQPage with these items.                                                             |
| C01 | `Button.astro`       | Adds `variant="secondary"`: 17/600, `--text`, 1px ink, padding 15×24 (16 minus the border). Hover (fine pointer): hatch background (the existing `.btn-secondary:hover` rule in `motion.css` uses class `btn-secondary`; the component adds that class).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| —   | `CtaRow.astro`       | Gains `sub?: string` (15 muted under the heading, gap 6) and `secondary?: { href, label }` (rendered before the primary, gap 12, wrap).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Pages

**ServicesPage** (main gap `clamp(48px,7cqi,80px)`):

1. Header: SheetHeader `SHEET 02 — SERVICES` / `P-01 — P-03`, h1 (Page H1, max 900, balance), lead (`clamp(17px,1.5cqi,19px)`/1.45 muted, max 640).
2. Sheets: column, gap 32, three `ServiceSheet`.
3. `ProcessRows`.
4. `Faq` (Services items, heading `Working together.`).
5. CtaRow: `Have a problem that fits?`, secondary `See pricing` → pricing, primary `Start a project →`.

**PricingPage**:

1. Header: SheetHeader `SHEET 05 — PRICING` / `USD · REV {site.rev}`, h1, lead.
2. Packages (gap 14): grid `auto-fit minmax(min(100%,300px),1fr)` gap 24 stretch of `PackageCard`; NGO note 15 muted.
3. `CompareTable`.
4. `Faq` (Pricing items, heading `Before you ask.`, intro).
5. CtaRow: `Not sure which one fits?` with sub `Describe the problem and I will suggest a package.`.

Copy is verbatim from the two `COPY` objects and lives in `ui[lang].services`, `.pricing`, `.process` and `.compare` (row labels).

## Error handling

- Invalid package or FAQ data fails the build (Zod).
- A missing `en`/`es` twin is not expected for packages. `PricingPage` throws if a language has no packages, so it never renders an empty grid.
- FAQ without items renders nothing.

## Testing

- **Unit** (`tests/offer-unit.spec.ts`): `formatUsd`, `priceShort` (project / month EN / month ES), `unitLabel`, `faqFor` (pricing 6, services 4, `both` included, sorted, language-scoped), `byOrder`.
- **e2e** (`tests/offer.spec.ts`), EN and ES:
  - **Services:**
    - 3 sheets; featured has the 2px frame + corner + badge.
    - FROM `$2,800 / mo` for P-03.
    - 4 process rows.
    - FAQ header `FAQ · 04` and 4 items with the first open.
    - CTA has both buttons with the right hrefs.
  - **Pricing:**
    - 3 cards; featured has frame, badge, primary button and corner; others have an outlined button.
    - Prices and units are right.
    - Compare has 7 rows × 3 values and is scrollable at 375 with `SWIPE` visible (hidden at 1280).
    - FAQ is `FAQ · 06`, first open, and a second opens without closing the first.
    - JSON-LD parses, `@type` FAQPage with 6 `mainEntity`.
  - **No JS:** FAQ items toggle (native).
- `overflow.spec.ts`: Services and Pricing are already in `ROUTES`, so they are covered at 5 widths. The compare scroller must not cause page overflow.
- `ds.spec.ts`: new specimens (`#package-card`, `#faq`, `#compare`).

## Done when

All tests pass locally and in CI, the Vercel preview shows both screens, and screenshots at 1280/375 match the two `.dc.html` files. The roadmap is updated: SP3 Offer done; SP4 Home & About added; the old SP4–SP7 renumbered to SP5–SP8.
