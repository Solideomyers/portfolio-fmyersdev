# fmyers.dev — content drafts (Rev 2026.10)

Drafts for the future Astro repo. Paths mirror `src/content/`; copy this folder as-is.

| Path | Collection | Status |
|---|---|---|
| work/en/fm-01-churchapp.md | work | EN from Solideomyers/case-studies, frontmatter added |
| work/es/fm-01-churchapp.md | work | ES draft — review |
| work/en/fm-02-chapel.md | work | EN from Solideomyers/case-studies, frontmatter added |
| work/es/fm-02-chapel.md | work | ES draft — review |
| faq/en.json · faq/es.json | faq | 10 items (6 pricing, 4 services; 2 shared) — review figures |
| pages/en/privacy.md · pages/es/privacy.md | pages | Draft — not legal advice; review before launch |
| other-work.json | otherWork | 3 repos, EN + ES one-liners |

## Placeholders
- Screenshots point to `/work/fm-NN/*`; designs show hatch placeholders until the sample-data captures exist.
- FM-02 metrics carry `date: 2026-10` (assumed snapshot month). Confirm.
- FM-03 AquaPro is paused and has no file.

## Adding a project
1. Copy `work/en/fm-02-chapel.md` to `work/en/fm-NN-slug.md` (next FM-ID) and the ES twin.
2. Put screenshots in `public/work/fm-NN/`.
3. Set `featured: true` to show it on Home (max 3, by `order`). `draft: true` hides it from lists.
