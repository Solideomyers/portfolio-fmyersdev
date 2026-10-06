# fmyers.dev — Design System (Rev 2026.10)

Personal brand system for Francisco Myers, a fullstack developer (Next.js · NestJS · PostgreSQL · Google Workspace automation) who sells to freelance clients: SMBs, churches/NGOs, CTOs, recruiters and agencies.

Surfaces:
- **fmyers.dev**: portfolio + future blog. Built with Astro, bilingual EN/ES (one language per page, `/en` and `/es`), light and dark modes.
- **GitHub profile README**: static SVG sheets with automatic light/dark (`assets/*-light.svg` / `*-dark.svg`).
- **LinkedIn banner**: `assets/linkedin-banner.png`.

Specimen with all tokens, components and rules: `../fmyers.dev Design System.dc.html`.

## Files
- `styles.css`: single entry point. Contains only `@import` lines.
- `tokens/fonts.css`: Archivo (wdth 100–125, wght 400–700) and JetBrains Mono 500, both from Google Fonts.
- `tokens/colors.css`: base `--fm-*` tokens plus semantic aliases. Dark mode via `[data-theme="dark"]` or `prefers-color-scheme`.
- `tokens/typography.css`, `tokens/spacing.css`: type scale, spacing, borders and motion.
- Logos: `../assets/logo-*.svg`, `../assets/wordmark-*.svg`.

## Content fundamentals
- Voice: first person, plain and concrete. Example: "I build SaaS products, end to end." Avoid "We", hype and buzzwords.
- Address the reader as you / tú. Use informal Spanish.
- Every section label is a numbered sheet: `SHEET 02 — SELECTED WORK` / `LÁMINA 02 — PROYECTOS`. Labels are in mono caps. Headlines and body text use sentence case.
- Use real numbers only. If a metric is unknown, omit the row.
- No emoji. Glyphs: `→` action, `↗` external link, `←` back, `—` bullet, `·` separator.
- Bilingual: the website shows one language at a time. Static surfaces (README, LinkedIn) stack EN above ES in mono.

## Visual foundations
- Concept: technical drawing sheets. 2px ink frame, 8-zone ruler, cobalt corner square at the bottom right.
- Color: warm-gray paper, ink and graphite. Cobalt is the only accent, used once per region. Signal green is only for availability and success. Alert red is only for form errors.
- Type: Archivo 700 at width 110 for display, Archivo 400 for body, JetBrains Mono 500 caps for labels, keys and IDs.
- Corners: radius 0 everywhere. The only round element is the status dot.
- Depth: no shadows, no gradients, no blur. Depth comes from frames, rules and diagonal hatch (`--hatch`, 135°, 10px), which is also used for image placeholders.
- Cards: 1px ink border on the raised surface. Hover changes the border to cobalt. Spec tables use a 1px grid made with `gap:1px` over the `--line` color.
- Motion: measured, like a plotter. Press 160ms, hover 200ms, entries 350ms, sheets 450ms, strokes 600ms. Card → case morph via View Transitions, circular theme reveal, scroll reveal once with 60ms stagger. Reduced motion = opacity only. Full spec: `../fmyers.dev Motion Spec.dc.html`; tokens `tokens/motion.css`; rules `motion.css`; library: Motion (vanilla).
- Layout: content max width 1280, prose max width 680, gutter `clamp(20px,4vw,48px)`. Breakpoints are 1280 (desktop), 768 (tablet) and 375 (mobile). The nav is sticky. On mobile the menu shows full-width rows with a 44px minimum height.
- Imagery: real screenshots only, inside a FIG frame with a caption. The portrait is black and white, high contrast, with the cobalt corner.

## Components (Astro, to build)
Button, Field / ChipGroup / ContactForm, SheetHeader / Sheet, SpecTable, Status, Tag / Chip, ProjectCard, PackageCard, SiteNav / SiteFooter, LangSwitch + ThemeToggle, Figure, PostRow / Prose, Pagination, Faq, Toc.

## Iconography
No icon set. Typographic glyphs and two brand marks only: the status dot and the cobalt corner square.
