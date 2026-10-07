# fmyers.dev — Roadmap

Source of truth for the design: `docs/handoff/` (moved from `design_handoff_fmyers_dev/` in SP0).
Since SP2, sub-projects are vertical slices (components arrive with the screens that use them; decided 2026-10-06). Each sub-project (SP) has its own spec + plan, its own branch/worktree, one PR to `develop`, and an automatic tag on merge.

## Stack (closed — decided 2026-10-06)

- Astro, static output, TypeScript strict, **npm**.
- Plain CSS with the handoff tokens (semantic layer only). Astro scoped styles.
- Vanilla TypeScript `<script>` for interactivity.
- **No React, no Tailwind, no shadcn.** Rationale: the design system (radius 0, no shadows, single accent) contradicts shadcn defaults; tokens already exist as CSS; every interactive piece is small and the contact form must work without JS. Escape hatch: `@astrojs/react` for a single island if a future need appears.
- Hosting Vercel (prod = `main`, previews per branch/PR). DNS Cloudflare (SP8).
- Repo `Solideomyers/portfolio-fmyersdev`, **public** (free branch protection).

## Sub-projects

| SP               | Branch                  | Scope                                                                                                                                                                              | Done when                                                                                                              | Status        | Spec                                             | Plan                                      |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------ | ----------------------------------------- |
| SP0 Bootstrap    | `feature/sp0-bootstrap` | Astro + tooling, git/Husky/commitlint/gitleaks, CI, auto-tag, branch protection, Vercel, CLAUDE.md/CONTRIBUTING.md, tokens                                                         | Preview URL live, CI green, invalid commit rejected locally and in PR title, `v0.1.0` tag, protection verified via API | done (v0.1.0) | [spec](specs/2026-10-06-sp0-bootstrap-design.md) | [plan](plans/2026-10-06-sp0-bootstrap.md) |
| SP1 Shell & i18n | `feature/sp1-shell`     | Base layout, theme anti-flash, `/` language redirect, `/en` `/es` with translated slugs, SiteNav/SiteFooter, LangSwitch/ThemeToggle, `site.ts`, 404                                | Empty navigable site in both languages and themes                                                                      | done (v0.2.0) | [spec](specs/2026-10-06-sp1-shell-design.md)     | [plan](plans/2026-10-06-sp1-shell.md)     |
| SP2 Work         | `feature/sp2-work`      | Vertical slice: work + otherWork collections (MDX cases), C01/C04–C08/C12–C14/C17 + Metrics/CtaRow, Work index (P10), Case study (P02), `/ds` specimens                            | Both screens match the `.dc.html` files at 1280/768/375; `/ds` renders                                                 | done (v0.3.0) | [spec](specs/2026-10-06-sp2-work-design.md)      | [plan](plans/2026-10-06-sp2-work.md)      |
| SP3 Offer        | `feature/sp3-offer`     | Vertical slice: pricing + faq collections; PackageCard (C09), ServiceSheet, ProcessRows, CompareTable, FAQ (C16), Button secondary; Services (P03), Pricing (P04)                  | Both screens match the `.dc.html` files at 1280/768/375                                                                | done (v0.4.0) | [spec](specs/2026-10-07-sp3-offer-design.md)     | [plan](plans/2026-10-07-sp3-offer.md)     |
| SP4 Home & About | `feature/sp4-home`      | Vertical slice: Home (P01: hero sheet + ruler, featured work, compact PackageCards, process, contact CTA), About (P06: portrait, timeline, stack), Privacy (P11: pages collection) | Screens match the `.dc.html` files at 1280/768/375                                                                     | done (v0.5.0) | [spec](specs/2026-10-07-sp4-home-design.md)      | [plan](plans/2026-10-07-sp4-home.md)      |
| SP5 Contact      | `feature/sp5-contact`   | ContactForm, `/api/contact` Vercel function (Turnstile, honeypot, validation) → Apps Script (Sheet + emails), `/contact/sent`, no-JS path                                          | Real submission lands in the Sheet and redirects                                                                       | plan written  | [spec](specs/2026-10-07-sp5-contact-design.md)   | [plan](plans/2026-10-07-sp5-contact.md)   |
| SP6 Motion       | `feature/sp6-motion`    | D01–D18, View Transitions, reduced motion                                                                                                                                          | Handoff motion QA checklist passes                                                                                     | pending       | —                                                | —                                         |
| SP7 Blog         | `feature/sp7-blog`      | P08/P09, MDX, RSS, OG images, `blogEnabled` flag                                                                                                                                   | Blog hidden by flag; works when enabled                                                                                | pending       | —                                                | —                                         |
| SP8 Launch       | `feature/sp8-launch`    | Domain (Cloudflare → Vercel), cookieless analytics, sitemap, placeholder replacement, Lighthouse                                                                                   | fmyers.dev live, handoff QA checklist passes                                                                           | pending       | —                                                | —                                         |

## Process per SP

1. Brainstorm → spec → plan (superpowers). Spec + plan are the **first commit** on the SP branch; push the branch and open a draft PR immediately so nothing is lost.
2. Work in `.worktrees/sp<N>-<topic>/` (`git worktree add .worktrees/sp<N>-<topic> -b feature/sp<N>-<topic> develop`).
3. PR to `develop`, squash merge, auto-tag. Update this table in the same PR.
4. `release/*` promotes `develop` → `main` when a milestone is ready for production.
