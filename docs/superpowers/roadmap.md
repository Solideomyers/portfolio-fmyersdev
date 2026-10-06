# fmyers.dev — Roadmap

Source of truth for the design: `docs/handoff/` (moved from `design_handoff_fmyers_dev/` in SP0).
Each sub-project (SP) has its own spec + plan, its own branch/worktree, one PR to `develop`, and an automatic tag on merge.

## Stack (closed — decided 2026-10-06)

- Astro, static output, TypeScript strict, **npm**.
- Plain CSS with the handoff tokens (semantic layer only). Astro scoped styles.
- Vanilla TypeScript `<script>` for interactivity.
- **No React, no Tailwind, no shadcn.** Rationale: the design system (radius 0, no shadows, single accent) contradicts shadcn defaults; tokens already exist as CSS; every interactive piece is small and the contact form must work without JS. Escape hatch: `@astrojs/react` for a single island if a future need appears.
- Hosting Vercel (prod = `main`, previews per branch/PR). DNS Cloudflare (SP7).
- Repo `Solideomyers/portfolio-fmyersdev`, **public** (free branch protection).

## Sub-projects

| SP                       | Branch                   | Scope                                                                                                                                               | Done when                                                                                                              | Status        | Spec                                             | Plan                                      |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------ | ----------------------------------------- |
| SP0 Bootstrap            | `feature/sp0-bootstrap`  | Astro + tooling, git/Husky/commitlint/gitleaks, CI, auto-tag, branch protection, Vercel, CLAUDE.md/CONTRIBUTING.md, tokens                          | Preview URL live, CI green, invalid commit rejected locally and in PR title, `v0.1.0` tag, protection verified via API | done (v0.1.0) | [spec](specs/2026-10-06-sp0-bootstrap-design.md) | [plan](plans/2026-10-06-sp0-bootstrap.md) |
| SP1 Shell & i18n         | `feature/sp1-shell`      | Base layout, theme anti-flash, `/` language redirect, `/en` `/es` with translated slugs, SiteNav/SiteFooter, LangSwitch/ThemeToggle, `site.ts`, 404 | Empty navigable site in both languages and themes                                                                      | pending       | —                                                | —                                         |
| SP2 Components & content | `feature/sp2-components` | C01–C17, content collections (work, faq, pages, otherWork, pricing) with the handoff Zod schemas                                                    | `/_ds` specimen page matches `Design System.dc.html`                                                                   | pending       | —                                                | —                                         |
| SP3 Screens              | `feature/sp3-screens`    | P01–P07, P10, P11                                                                                                                                   | Screens match screenshots at 1280/768/375                                                                              | pending       | —                                                | —                                         |
| SP4 Contact              | `feature/sp4-contact`    | ContactForm, Apps Script endpoint, Turnstile, honeypot, `/contact/sent`, no-JS path                                                                 | Real submission lands in the Sheet and redirects                                                                       | pending       | —                                                | —                                         |
| SP5 Motion               | `feature/sp5-motion`     | D01–D18, View Transitions, reduced motion                                                                                                           | Handoff motion QA checklist passes                                                                                     | pending       | —                                                | —                                         |
| SP6 Blog                 | `feature/sp6-blog`       | P08/P09, MDX, RSS, OG images, `blogEnabled` flag                                                                                                    | Blog hidden by flag; works when enabled                                                                                | pending       | —                                                | —                                         |
| SP7 Launch               | `feature/sp7-launch`     | Domain (Cloudflare → Vercel), cookieless analytics, sitemap, placeholder replacement, Lighthouse                                                    | fmyers.dev live, handoff QA checklist passes                                                                           | pending       | —                                                | —                                         |

## Process per SP

1. Brainstorm → spec → plan (superpowers). Spec + plan are the **first commit** on the SP branch; push the branch and open a draft PR immediately so nothing is lost.
2. Work in `.worktrees/sp<N>-<topic>/` (`git worktree add .worktrees/sp<N>-<topic> -b feature/sp<N>-<topic> develop`).
3. PR to `develop`, squash merge, auto-tag. Update this table in the same PR.
4. `release/*` promotes `develop` → `main` when a milestone is ready for production.
