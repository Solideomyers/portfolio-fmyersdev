# Handoff: fmyers.dev — portfolio site (Astro)

## Overview
fmyers.dev is the personal site of Francisco Myers, a fullstack developer in Venezuela (UTC−4) who sells three services: SaaS MVPs, Google Workspace automations and monthly fullstack contracts. The site has to:
- show case studies (FM-NN) that you can add without touching code,
- explain the services and the reference prices,
- turn visitors into contact briefs.

It is bilingual (EN/ES, one language per page), supports a light and a dark theme, and has three breakpoints: 1280, 768 and 375.

This bundle has everything designed so far: the design system (tokens + 17 components), the motion spec, 12 screens in both languages and themes at the three breakpoints, the content drafts (Markdown/JSON in the shape of Astro content collections), the decision log, and screenshots.

## About the design files
The files in `design/` are **design references built in HTML**: prototypes that show the intended look and behaviour. They are not production code to copy. Each `*.dc.html` is a self-contained HTML "Design Component" (inline styles, a small logic class, loaded by `support.js`). Open them in a browser to inspect them.

**The task is to rebuild these designs in a new Astro project.** Use Astro components, content collections and plain CSS with the tokens in `design/design-system/`. No CSS framework or motion library is required. Optionally use `motion` (vanilla) for the four JS animations listed below.

The new repo does not exist yet. `Solideomyers/Solideomyers` on GitHub is the **content source only** (case-study Markdown and screenshots), not the site repo.

## Fidelity
**High-fidelity.** Colours, type, spacing, borders, copy, states and motion are final. Recreate them pixel-for-pixel. The only placeholders are:
- **Prices:** reference values (see "Placeholders").
- **Images:** the portrait and every screenshot are hatch boxes for now.
- **Availability date:** "Nov 2026".

---

## Tech decisions (already made)
| Topic | Decision |
|---|---|
| Framework | Astro, static output. MDX for posts. `astro:transitions` `<ClientRouter />` for page morphs. |
| Hosting | Vercel. DNS on Cloudflare. |
| i18n | `/en/...` and `/es/...` routes. `/` detects the browser language and redirects, and remembers the LangSwitch choice in localStorage. ES slugs are translated (see routes). A page missing in one language falls back to the other with an "Only in English / Solo en español" tag. |
| Contact form | POSTs to a Google Apps Script web app that appends to a private Google Sheet and emails a notification. Spam: honeypot field `website` + Cloudflare Turnstile. Expect ~1–2 s latency. |
| Email | Public address `hola@fmyers.dev`, forwarded via Cloudflare Email Routing to `fmyersdev@gmail.com`. |
| Analytics | Cookieless (Cloudflare Web Analytics or Umami). No cookie banner. |
| Blog | Designed and built, but hidden until there are 3 posts: a config flag `blogEnabled` hides the NOTES nav item, the Home "latest note" block and the routes. RSS + auto OG images in the sheet style. No comments. |
| Theme | `data-theme="light|dark"` on `<html>`. The default follows the OS. The choice is saved in localStorage and set inline in `<head>` to avoid a flash. |

---

## Design tokens
All tokens are in `design/design-system/tokens/*.css`, imported by `design/design-system/styles.css`. Components only read the **semantic** layer.

### Colour
| Semantic | Base token | Light | Dark | Use |
|---|---|---|---|---|
| `--bg` | `--fm-paper` | `#F2F3EF` | `#0E1114` | Page |
| `--surface` | `--fm-paper-raised` | `#F8F9F6` | `#151A1F` | Cards, tables, form frame |
| `--hatch` | `--fm-hatch` | `#E4E7E1` | `#1E242A` | Placeholder hatch, secondary hover |
| `--line` | `--fm-rule` | `#C4C9C1` | `#353C44` | 1px rules, table gaps |
| `--line-strong` / `--text` | `--fm-ink` | `#15181C` | `#E9EBE6` | Ink borders, text |
| `--text-muted` | `--fm-graphite` | `#5B626A` | `#98A0A8` | Secondary text, labels |
| `--accent` | `--fm-cobalt` | `#2B55C8` | `#86A4F2` | The only accent: CTAs, IDs, links, corner mark |
| `--accent-fg` | `--fm-on-cobalt` | `#FFFFFF` | `#0E1114` | Text on accent |
| `--ok` | `--fm-signal` | `#1F8A4C` | `#4CC47F` | Status dot, success |
| `--danger` | `--fm-alert` | `#B3362B` | `#F08A80` | Errors |
| `--invert-bg` / `--invert-fg` | ink / paper | — | — | Selected chips, "MOST CHOSEN" badge, contact CTA block |

### Typography
- Fonts: **Archivo** (variable, width 100–125, weight 400–700; display text uses `font-stretch:110%`) and **JetBrains Mono 500**, both from Google Fonts (`tokens/fonts.css`).

| Token | Size | Weight / LH / LS | Use |
|---|---|---|---|
| Display XL | `clamp(40px, 6.6cqi, 84px)` | 700 / 0.95 / −0.035em | Hero h1, case title |
| Page H1 | `clamp(40px, 5.6cqi, 72px)` | 700 / 0.95 / −0.035em | Inner page h1 |
| Display L | `clamp(32px, 4.1cqi, 52px)` | 700 / 1 / −0.03em | Section h2 |
| H2 card | 34px (28 on small) | 700 / — / −1px | Project card title |
| H3 | 28px (24–28) | 700 / — / −0.5px | Prose h2 |
| H4 | 22px | 700 | Process step, timeline milestone |
| Body L | 19px (17 on mobile) | 400 / 1.45 | Lead |
| Body | 17px | 400 / 1.5 (prose 1.6–1.65) | Default |
| Body S | 15px | 400 / 1.45 | Notes, list items |
| Label | 13px mono | 500 / — / +1px, UPPERCASE | Sheet headers, nav, links |
| Spec key | 11px mono | 500 / — / +1px, UPPERCASE | Table keys |

`cqi` units: every page root is `container-type:inline-size`, so type scales with the page width. In Astro you can use `vw` instead, or keep the container on `<body>`.

### Spacing, layout and borders
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.
- Page max width **1280**, prose max **680**, gutter `clamp(20px, 4vw, 48px)`.
- Main padding: top `clamp(24px,4cqi,48px)`, bottom `clamp(56px,8cqi,96px)`. Gap between sections `clamp(48px,7cqi,80px)`.
- Borders:
  - `--border-rule`: 1px `--line`
  - `--border-ink`: 1px ink
  - `--border-frame`: 2px ink. Use at most one frame per screen, for the hero sheet or the featured item.
- **Radius is always 0.** The only round element is the status dot (8–10px).
- **No shadows.** Depth comes from frames, hatch and tables with a 1px `gap` over `--line`.
- **Corner mark:** a cobalt square at `right:-2px; bottom:-2px`, 28px on sheet frames and 20px on featured cards.
- **Hatch:** `repeating-linear-gradient(135deg, var(--hatch) 0 1px, transparent 1px 10px)`.

### Motion tokens (`tokens/motion.css`)
- Easings:
  - `--ease-out`: `cubic-bezier(.23,1,.32,1)` — entries and feedback.
  - `--ease-in-out`: `cubic-bezier(.77,0,.175,1)` — things moving on screen.
  - `--ease-draw`: `cubic-bezier(.65,0,.35,1)` — strokes.
- Durations:
  - Feedback: press 160, hover 200, fade 150.
  - Transitions: exit 250, enter 350, sheet 450, draw 600 ms.
- Distances: stagger 60ms (max 6 items), rise 12px, shake 6px, press-scale .97.
- Reduced motion sets rise, shake and stagger to 0 and press-scale to 1. Only fades remain.

---

## Components (build as Astro components)
The specimens are in `design/fmyers.dev Design System.dc.html` (B1–B15); the inventory is in `design/fmyers.dev Inventory.dc.html`.

| ID | Component | Variants / notes |
|---|---|---|
| C01 | **Button** | Primary: accent bg, 17px/600, padding 16×24. Secondary: transparent, 1px ink, hover bg `--hatch`. Link: mono 13 accent with →. Small: mono 13, padding 12×18. Disabled: hatch bg + muted text. Press `scale(.97)` 160ms. |
| C02 | **Field / ChipGroup** | Fields share one 2px frame on `--surface` and are separated by 1px rules, padding 14×20. The label sits inside the field (mono 12, muted, caps). Focus: inset 2px cobalt underline. Error: inset 3px `--danger` left bar, red label and message. Chips: mono 13, min-height 40, 1px ink, selected = invert. |
| C03 | **ContactForm** | Name, email, project type (single chip: SaaS MVP / Automation / Contract / Other), budget (optional single chip: < $1k / $1–5k / $5–10k / $10k+ / Not sure yet), message (4 rows), Turnstile, privacy note + link, submit (min-width 200). The honeypot `website` input sits off-screen. |
| C04 | **SheetHeader / Sheet** | Header: mono 13 caps, number + title left, meta right, 1px ink rule below. Sheet: 2px frame, optional 8-zone ruler (32px tall, zone 1 in accent), corner mark. |
| C05 | **SpecTable** | Key/value rows (120px mono key column + value), min-height 52; or a grid of cells with a 1px gap. Omit rows that have no data. |
| C06 | **Status** | Live: filled green dot. In use: green ring. Pilot: dashed. Available: dot + sentence with the next-slot date. The dot never pulses. |
| C07 | **Tag / Chip** | Static tag: mono 12, 1px ink, padding 6×10. |
| C08 | **ProjectCard** | 1px ink on surface. Header row (FM-ID accent + status badge), 16:10 screenshot, title 34/700, summary 16, 2×2 spec grid (SECTOR, STACK, ROLE, YEAR), "READ CASE →". Hover: border goes cobalt in 200ms. Shares `transition:name="sheet-{id}"` with the case-study header. |
| C09 | **PackageCard** | ID, optional "MOST CHOSEN" invert badge, name, "for" line, FROM + price (32–44px/700) + unit, dashed rule, includes list (— bullets), timeline, button. Featured: 2px frame, surface bg, primary button, 20px corner mark. |
| C10 | **SiteNav / SiteFooter** | Sticky, `--bg`, 1px ink bottom border. Desktop: wordmark · numbered links (mono 13: 01 SERVICES · 02 WORK · 03 ABOUT · 04 PRICING · 05 CONTACT [· 06 NOTES when the blog is on]) · EN\|ES · theme ◐ · START A PROJECT. Current link: accent + 2px accent underline. Tablet/mobile: wordmark + MENU (44px); the menu opens full-width 52px rows plus EN\|ES, theme and CTA. Footer: mono 12 muted, `FMYERS.DEV · REV 2026.10`, GitHub/LinkedIn/WhatsApp/Privacy, `© 2026 · ENGLISH`. |
| C11 | **LangSwitch + ThemeToggle** | Segmented EN\|ES with the active one inverted. Square ◐ toggle, 34px (44 in the menu). |
| C12 | **Figure** | 1px ink frame, hatch placeholder until loaded, caption `FIG. N` (accent) + text, mono 12. Ratios: 16:10 screenshots, 4:5 portrait. |
| C13 | **PostRow** | Grid 96px meta (N-ID / date, mono 12) + title 22–28/700 + dek + category · minutes. Hover: text goes cobalt. Also used for "Other work" rows (OW-ID, title, one-liner, stack, REPO ↗). |
| C14 | **Prose** | Max 680. h2 24–28/700 with a mono number. Body 17/1.65. Lists use "—" mono bullets. Blockquote: 2px ink left border, 19–22px. Code: mono 14, surface, 1px rule, horizontal scroll. |
| C15 | **Pagination** | Numbered cells 44×44 with a 1px rule grid, current = invert, "…" gaps, ← PREV / NEXT → disabled at the ends (opacity .35). Shown only from 10 items, with `/page/2` URLs. Prev/next-with-title variant for posts (chronological) and cases (next FM-ID, wraps around). |
| C16 | **FAQ** | Native `<details>`. Each row: Q-ID mono (44px column), question 17/600, + icon that rotates 45° to ×. The first item starts open; several can be open. Answer 15/1.55 muted, indented 52px. One collection with a `page` field; emit FAQPage JSON-LD. |
| C17 | **TOC** | Shown when the page has 3 or more h2. Desktop: sticky (`top:88px`) 240px sidebar, 36px rows, 2px cobalt marker that slides 200ms, h2 + h3. Tablet/mobile: collapsible 48px block "CONTENTS · 03/05 Constraints +", h2 only, closes when you pick a section. |

---

## Screens
Every screen exists at 1280 / 768 / 375, in EN and ES, and in light and dark. Screenshots are in `screenshots/` (EN, light, plus one ES/dark sample and a menu-open sample). Layouts use flex-wrap and `auto-fit minmax()` grids, so they reflow between breakpoints rather than switching layouts. The exceptions are the nav (desktop vs MENU) and the TOC (sidebar vs block).

| ID | Screen | Route EN · ES | Sections, top to bottom | File |
|---|---|---|---|---|
| P01 | Home | `/en` · `/es` | Hero sheet (8-zone ruler, "SHEET 00 — FRANCISCO MYERS · FULLSTACK DEVELOPER", h1 "I build SaaS products end to end.", lead, Status, Start a project → / See work, facts SpecTable: STACK, AUTOMATION, BASED IN, LANGUAGES) → Selected work (featured ProjectCards, max 3, + ALL WORK →) → Services (3 compact PackageCards + NGO note) → Process (4 steps) → [Latest note, only if blog is on] → Contact CTA (invert block, WhatsApp + email) | `Home.dc.html` |
| P02 | Case study | `/en/work/[slug]` · `/es/proyectos/[slug]` | ← ALL WORK → SheetHeader (FM-ID, status + version) → 2px sheet (title, summary, client · role · timeline, spec grid SECTOR/MODULES/STACK/STATUS) → FIG. 1 → TOC + Prose (Context · Problem · Constraints · Solution · Outcome), FIG. 2 inside Solution, metrics grid + "AS OF" date inside Outcome → Next project card → "Want something similar?" CTA | `Case Study.dc.html` |
| P03 | Services | `/en/services` · `/es/servicios` | Header → one sheet per service (ID, name, for, FROM, timeline, see pricing; WHAT I DO / WHAT YOU GET; stack tags; proof line) → Process rows → FAQ (Q-07…Q-10) → CTA | `Services.dc.html` |
| P04 | Pricing | `/en/pricing` · `/es/precios` | Header (h1 "Clear starting prices. A fixed quote after the spec.") → 3 PackageCards (SaaS MVP featured) + NGO/payment note → Compare table (7 rows; horizontal scroll under 620px) → FAQ (Q-01…Q-06, first open) → CTA | `Pricing.dc.html` |
| P05 | Contact | `/en/contact` · `/es/contacto` | Header → left: h1, lead, Status, channel rows (WHATSAPP +58 424 908 0683 ↗ / EMAIL hola@fmyers.dev / LINKEDIN in/franciscomyers ↗) → right: ContactForm. States: empty, field error, sending, network error. | `Contact.dc.html` (`view` prop) |
| P05b | Confirmation | `/en/contact/sent` · `/es/contacto/enviado` | Framed drawn check → "BRIEF RECEIVED" → h1 "Thanks. I'll reply within 2 business days." → copy note → spec grid (REPLY BY, TIME ZONE VET · UTC−4, FROM) → Back home / SEE SELECTED WORK. Also works without JS. | `Contact.dc.html` `view="sent"` |
| P06 | About | `/en/about` · `/es/sobre-mi` | Portrait 4:5 (B&W, corner mark) + role, h1 name, 2-paragraph bio, facts grid → Timeline (6 milestones, current ones in accent) → Stack grid (6) → CTA | `About.dc.html` |
| P07 | 404 | `/404` (language from the path prefix) | Sheet crossed out by two drawn diagonals; h1 "This sheet isn't in the set."; Back home + WORK / CONTACT | `Not Found.dc.html` |
| P08 | Notes index | `/en/notes` · `/es/notas` | Header + RSS ↗ → category chips with counts (All, Process, Automation, Engineering, Cases) → PostRows → Pagination (from 10). Empty state: dashed box + "SHOW ALL NOTES". | `Blog Index.dc.html` (`filter` prop) |
| P09 | Note | `/en/notes/[slug]` · `/es/notas/[slug]` | ← ALL NOTES → header (N-ID · category, date · minutes, h1, dek, tags) → TOC + Prose → author block with WRITE TO ME → prev/next | `Blog Post.dc.html` |
| P10 | Work index | `/en/work` · `/es/proyectos` | Header (count) → ProjectCard grid, FM-ID descending → OTHER WORK rows (repos) → CTA. The sector filter stays hidden until 6 projects. | `Work Index.dc.html` |
| P11 | Privacy | `/en/privacy` · `/es/privacidad` | Header (updated date) → Prose, 7 numbered sections → email button | `Privacy.dc.html` |

All copy (EN and ES) is in each file's `COPY` object and in `content/`.

---

## Interactions and motion
The full spec is `design/fmyers.dev Motion Spec.dc.html` (D01–D18). Animate only transform, opacity, clip-path and stroke-dashoffset.

| # | Interaction | Spec |
|---|---|---|
| D01 | Press | `scale(.97)` 160ms ease-out. Off under reduced motion. |
| D02 | Hover (fine pointer only) | Cobalt border, 4px arrow nudge, underline, hatch or row tint; 200ms. |
| D03 | Home signature (first load per session) | The 4 frame sides are drawn 130ms apart, then the ruler zones fade in with a 30ms stagger, the headline rises and the corner appears. About 1s in total. Never blocks input. |
| D04 | Scroll reveal | `[data-reveal]` children rise 12px + fade, 350ms, 60ms stagger (max 6), once. Content stays visible without JS. |
| D05 | Card → case | View Transition morph of `sheet-{id}`, 450ms ease-in-out; the rest crossfades. |
| D06 | Theme | Circular clip-path reveal from the toggle, 450ms. |
| D07 | Language | Root fade, 150ms. Keeps the scroll position. |
| D08 | Mobile menu | Clip-path from the top, 350ms in / 250ms out; rows 30ms stagger. |
| D09 | Sending | Button label `blur(2px)`, opacity .7, "Sending…". The button keeps its width. |
| D10 | Field error | Shake ±6px ×2, 300ms, plus the alert bar and message. |
| D11 | Confirmation | Panel rises 350ms; the check stroke draws in 400ms after a 200ms delay. |
| D12 | Copy-email toast | Slides from the bottom edge, 350 / 250ms, 2.4s hold. |
| D13 | Live ruler | Cobalt indicator follows the section in view, 450ms. |
| D14 | Hero crosshair | Spring follow (stiffness 520, damping 46), fine pointer only. |
| D15 | 404 | Two diagonals drawn 600ms ease-draw, 120ms apart. |
| D16 | Pagination | Hover only. A page change is a normal navigation. |
| D17 | FAQ | Icon rotates 45° in 200ms; the answer fades in and rises 6px in 250ms (`@starting-style`); height changes instantly; closing is instant. |
| D18 | TOC marker | Slides 200ms ease-in-out. IntersectionObserver `rootMargin: -30% 0 -60%`. |

Never animate: focus rings, nav jumps, content already revealed, the status dot, prices or spec values, anything on a loop, or elevation on hover.

### Form validation and states
- Email must match `^[^@\s]+@[^@\s]+\.[^@\s]+$`. Name and message are optional in the prototype; consider requiring the message.
- Submit flow:
  - Invalid: show the error state (D10).
  - Valid: `sending` (D09), POST to Apps Script, then navigate to `/contact/sent`.
  - On failure: show the ERR box *"The message didn't go through. Try again, or write to hola@fmyers.dev."*
- Chips toggle: clicking the selected chip clears it.

### State
- Global: `lang`, `theme`, `menuOpen`.
- Contact: `view` (form / sent), `phase` (idle / sending / neterr), `err`, `name`, `email`, `type`, `budget`, `msg`.
- FAQ: an open-set per item.
- TOC: active index from IntersectionObserver; `tocOpen` on mobile.
- Blog index: `category`.

---

## Content model (Astro content collections)
Drafts are ready in `content/`; copy that folder to `src/content/`. Its README explains how to add a project.

**work** (`work/{en,es}/fm-NN-slug.md`):
```ts
z.object({
  id: z.string().regex(/^FM-\d{2}$/), slug: z.string(), lang: z.enum(['en','es']),
  title: z.string(), summary: z.string(), client: z.string(),
  sector: z.array(z.string()), modules: z.array(z.string()), stack: z.array(z.string()),
  status: z.enum(['live','in-use','wip']), version: z.string().optional(),
  role: z.string(), timeline: z.string(), year: z.number(),
  cover: z.object({ src: z.string(), alt: z.string() }),
  shots: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string() })),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), date: z.string() })).default([]),
  featured: z.boolean().default(false), order: z.number().default(99), draft: z.boolean().default(false),
})
```
The body has 5 h2 sections: Context, Problem, Constraints, Solution, Outcome. `draft: true` hides the project from P01 and P10 but still builds its URL. FM-03 AquaPro is paused and has no file.

- **faq**: `faq/{en,es}.json`, items `{ id: 'Q-NN', page: 'pricing'|'services'|'both', order, q, a }`.
- **pages**: `pages/{en,es}/privacy.md`.
- **otherWork**: `other-work.json`, items `{ id: 'OW-NN', title, repo, stack[], en, es }`.
- **notes** (MDX): `{ id: 'N-NN', lang, title, dek, date, category: 'process'|'automation'|'engineering'|'cases', minutes, tags[] }`. The N-02 copy is in `Blog Post.dc.html`.
- **site config** (`src/config/site.ts`): `availableFrom: '2026-11'` (once the date has passed, show "Available for new projects"), `blogEnabled: false`, `budgets[]`, `projectTypes[]`, `whatsapp: '+584249080683'`, `email: 'hola@fmyers.dev'`, `formEndpoint`, `turnstileSiteKey`.
- **pricing** (`src/content/pricing/*.md`): `{ id, name, for, from, unit, includes[], timeline, featured }`.

## Placeholders to replace in development
| Item | Reference value | Where |
|---|---|---|
| SaaS MVP | From $4,500 per project · 4–6 weeks · featured | pricing |
| Automation | From $900 per project · 1–2 weeks | pricing |
| Fullstack contract | From $2,800/month · ~20 h/week | pricing |
| Maintenance plan | From $150/month, after the 30 included days | pricing / FAQ |
| Availability | Nov 2026 | `site.availableFrom` |
| Portrait | Hatch 4:5 "PORTRAIT · B&W"; final photo is a home session, window light, plain wall | `src/assets/portrait.jpg` |
| Screenshots | Hatch 16:10; ChurchApp needs new captures with sample data (production has real personal data) | `public/work/fm-NN/*` |
| FM-02 metrics date | `2026-10` (assumed) | `work/*/fm-02-chapel.md` |

## Assets
- `design/assets/wordmark-{light,dark}.svg`, `logo-{light,dark}.svg`: brand marks, from this project.
- No icon library and no emoji. Glyphs only: → ↗ ← — · ◐ + ✓, plus the status dot and the corner square.
- Real screenshots come from `Solideomyers/Solideomyers/assets/shots/` (`churchapp.png`, `churchapp-panel.jpg`, `chapel.png`), except the ChurchApp ones, which must be recaptured as noted above.

## Accessibility
- Hit targets are at least 44px on touch.
- The nav's current link uses `aria-current="page"`; the active TOC item uses `aria-current="location"`.
- Chips use `aria-pressed`; the FAQ and TOC toggles use `aria-expanded`; form errors use `role="alert"` and `aria-invalid`.
- Status is never shown by colour alone: dots always come with a label.
- Text contrast is at least 4.5:1 in both themes.

## QA checklist
- Every animation at 4× slow-motion stays in sync.
- With reduced motion, only fades remain and all content is visible.
- With JS off, all `[data-reveal]` content is visible and the form posts and redirects.
- On touch devices there is no crosshair and no hover states.
- Safari and Firefox without View Transitions swap instantly.
- At 375 nothing overflows horizontally; only the compare table and code blocks scroll.

---

## Files
```
design_handoff_fmyers_dev/
  README.md                         ← this file
  (screenshots ship as a separate download: design_handoff_fmyers_dev_screenshots/, 47 PNGs named pNN-<screen>-<bp>[-state].png — place it at ./screenshots)
  content/                          ← copy to src/content/ (work, faq, pages, other-work, README)
  design/
    fmyers.dev Screens.dc.html      ← canvas with every screen × breakpoint (lang/theme tweaks)
    fmyers.dev Design System.dc.html← tokens + components B1–B15 + motion demos
    fmyers.dev Motion Spec.dc.html  ← printable motion spec D01–D18
    fmyers.dev Inventory.dc.html    ← screens, components, usage matrix, content model, placeholders
    fmyers.dev Decisions.dc.html ← 46 product decisions with the chosen option
    Home / Case Study / Services / Pricing / Contact / About / Work Index /
    Blog Index / Blog Post / Not Found / Privacy .dc.html   ← one per screen (props: lang, theme, bp)
    design-system/                  ← styles.css + tokens/*.css + motion.css + README + SKILL.md
    assets/                         ← wordmark and logo SVGs
    support.js, doc-page.js         ← runtime for opening the .dc.html files locally
```
To view the designs, serve `design/` with any static server (for example `npx serve design`) and open `fmyers.dev Screens.dc.html`.

Note on screenshots: the 404 diagonals and some fine hairlines can look dashed in the PNGs. That comes from the capture tool; in the browser they are solid strokes.
