# SP0 — Bootstrap · Design

Date: 2026-10-06 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp0-bootstrap`

## Goal

Leave a repository that enforces its own rules and deploys itself: Astro project with the design tokens, Git/Husky/commitlint/gitleaks, CI, auto-tag, branch protection, Vercel previews, and agent/human docs. No product UI beyond a token-check placeholder page.

## Decisions (approved in brainstorming)

- Stack is closed: Astro (latest stable, static output), TypeScript strict, **npm**, plain CSS with the handoff tokens, vanilla TS. No React / Tailwind / shadcn. No Vercel adapter (static output deploys without it; add only if a later SP needs it).
- Repo `git@github.com:Solideomyers/portfolio-fmyersdev.git` becomes **public** so branch protection is free.
- Work happens in git worktrees under `.worktrees/` (gitignored).
- Specs/plans are committed and pushed before implementation.
- Git rules follow the `git-husky-rulebook` skill (details below).

## Prerequisites (checked at the start of the plan)

Node 24, npm 11, `gh` authenticated as `Solideomyers`, a Vercel account with GitHub access, and `gitleaks` installed locally (`winget install gitleaks`). The pre-public history scan needs it.

## Repository layout after SP0

```
.github/workflows/ci.yml        lint:check · check · build · test · secrets
.github/workflows/pr-title.yml  commitlint on the PR title (reruns on title edit)
.github/workflows/tag.yml       auto-tag v0.N.0 on push to develop
.husky/pre-commit               lint-staged · astro check · gitleaks (if installed, else warn)
.husky/commit-msg               commitlint
.husky/pre-push                 npm test
scripts/scopes.cjs              single source of commit scopes
commitlint.config.cjs
.lintstagedrc.json
eslint.config.js · .prettierrc · .prettierignore
playwright.config.ts · tests/smoke.spec.ts
astro.config.mjs · tsconfig.json (strict) · package.json · .nvmrc (24)
src/styles/tokens/*.css, src/styles/motion.css, src/styles/global.css   ← tokens copied verbatim
src/pages/index.astro           token-check placeholder
public/                         wordmark/logo SVGs
docs/handoff/                   moved from design_handoff_fmyers_dev/ (unchanged)
docs/superpowers/{roadmap.md,specs/,plans/}
CLAUDE.md · CONTRIBUTING.md · README.md
.gitignore (node_modules, dist, .astro, .env*, !.env.example, .worktrees, test-results, playwright-report, .vercel)
```

## Git rules

### Branches

| Branch                            | Role                                                                   | Vercel         |
| --------------------------------- | ---------------------------------------------------------------------- | -------------- |
| `main`                            | Always deployable. No direct pushes. Advanced only by `release/*` PRs. | Production     |
| `develop`                         | Integration. **Default branch** on GitHub so PRs target it by default. | Preview        |
| `feature/sp<N>-<topic>`           | One SP = one branch = one PR.                                          | Preview per PR |
| `fix/<desc>`, `release/<version>` | Fixes; promotion develop → main.                                       | Preview        |

### Merge policy

- Squash only (merge commits and rebase merges disabled in repo settings). Delete branch on merge enabled.
- PR title = final commit message, validated by CI.
- The agent proposes commit messages; it never commits or pushes without explicit confirmation.

### Commits

Conventional Commits via commitlint. Scopes from `scripts/scopes.cjs`:
`ui, layout, i18n, content, pages, contact, motion, blog, config, ci, deps, docs`.
`feat`, `fix`, `refactor`, `test` must carry a scope; `docs`, `chore`, `ci`, `build`, `style`, `perf` may omit it, but a given scope must be in the list.
Valid: `feat(ui): add Button component` · `chore: bump astro`. Invalid: `feat: add button`, `feat(header): …`.

### Hooks (Husky 9)

- `pre-commit`: `npx lint-staged`, then `npm run check` (astro check), then `gitleaks protect --staged --redact` when `gitleaks` is on PATH; otherwise print a warning and continue (CI is the enforcing layer).
- `commit-msg`: `npx --no -- commitlint --edit "$1"`.
- `pre-push`: `npm test`.
- `prepare`: `husky` without `|| true` (Vercel builds run `npm install`; Husky 9 exits cleanly when `.git` is missing. Verified in the plan, fallback is `husky || true` only if Vercel's build fails).

lint-staged: `*.{astro,ts,js,mjs,cjs}` → `eslint --fix` + `prettier --write`; `*.{css,json,md,yml,yaml}` → `prettier --write`. `docs/handoff/**` is excluded from Prettier/ESLint (reference material, kept byte-identical).

### CI (`ci.yml`)

Triggers: `pull_request` to `develop` and to `main` (release PRs), `push` to `main`. Node 24, `npm ci`.
Jobs (names are the required status checks): `lint` (`npm run lint:check`, no fix), `check` (`npm run check`), `build`, `test` (Playwright chromium, after `build`), `secrets` (`gitleaks/gitleaks-action@v2`, full history). The `commitlint` job lives in `pr-title.yml` (PR events incl. `edited`): the title is passed via `env:` and piped to the local commitlint config. `wagoid/commitlint-github-action` is not used because it lints branch commits, not the title.

### Auto-tag (`tag.yml`)

On push to `develop`: next `v0.N.0` (minor bump), `permissions: contents: write`. Tags are immutable; a missed tag is not backfilled.

### Branch protection (`main` and `develop`)

Require PR, required checks `lint, check, build, test, commitlint, secrets`, strict (up to date), 0 required approvals (single developer), block force-push and deletion, enforce for admins. Applied via `gh api` after the checks have run once on the SP0 PR, and verified by reading back `gh api repos/Solideomyers/portfolio-fmyersdev/branches/{main,develop}/protection`.

## Bootstrap sequence (the only direct pushes)

1. At the project root: move `design_handoff_fmyers_dev/` → `docs/handoff/`, `git init -b main`, `.gitignore`, first commit `docs: add design handoff, roadmap and sp0 spec/plan`, add remote, push `main`.
2. Create and push `develop` from `main`; set `develop` as the default branch; squash-only + delete-on-merge settings.
3. `gitleaks detect` over the history, then switch the repo to public.
4. `git worktree add .worktrees/sp0-bootstrap -b feature/sp0-bootstrap develop`; all SP0 work happens there, pushed early as a draft PR to `develop`.
5. After the first green CI run on that PR, apply branch protection to `main` and `develop`.
   From step 4 on, nothing reaches `develop` or `main` without a PR.

## Astro project

- Scaffold with `npm create astro@latest` (minimal template, TS strict). If it refuses the non-empty worktree, scaffold in a temporary directory and copy the files in.
- Dependencies: `astro`, `@astrojs/check`, `typescript` (pinned `~6.0`: `@astrojs/check` and `typescript-eslint` don't support TS 7 yet); dev: `eslint`, `eslint-plugin-astro`, `typescript-eslint`, `prettier`, `prettier-plugin-astro`, `@playwright/test`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`. Nothing else.
- Scripts: `dev`, `build`, `preview`, `check` (`astro check`), `lint` (eslint --fix + prettier --write), `lint:check` (eslint + prettier --check), `test` (`playwright test`), `prepare`.
- Tokens: copy `docs/handoff/design/design-system/tokens/*.css` and `motion.css` to `src/styles/` **byte-identical**. `global.css` imports them in the same order as the handoff `styles.css`. Fonts load via `preconnect` + the same Google Fonts stylesheet `<link>` in head instead of the CSS `@import` (`fonts.css` is copied but not imported). The Astro Fonts API is not used: it would rename the families behind its own CSS variables and can't express Archivo's `wdth` axis cleanly, which would break the verbatim tokens. Self-hosting can be revisited in SP7 if Lighthouse asks for it.
- Placeholder `index.astro`: wordmark plus a swatch grid of the semantic colour tokens and the type scale, rendered on `--bg`. It follows the OS theme only (manual toggle and anti-flash are SP1).

## Vercel

Project imported from the GitHub repo (framework preset Astro, `npm run build`, output `dist`). Production branch `main`; previews for every other branch/PR. Node 24. No environment variables in SP0. The domain is SP7.

## Docs (three layers)

- `CLAUDE.md`: the closed stack and its forbidden additions; the handoff is the source of truth (`docs/handoff/README.md` first); components read only semantic tokens, radius 0, no shadows, no icon libraries or emoji; npm only; git rules condensed (branches, scopes, squash, never commit/push without confirmation); worktree workflow; where specs/plans/roadmap live and that the roadmap is updated in each SP's PR.
- `CONTRIBUTING.md`: the same git rules in explanatory form with valid/invalid examples, what each hook does, worktree commands, gitleaks install.
- Roadmap: process per SP (already written).
  Scopes are listed in `CONTRIBUTING.md` and `CLAUDE.md`. Changing `scripts/scopes.cjs` requires updating both in the same commit.

## Testing

`tests/smoke.spec.ts` (Playwright, chromium, against `astro preview` of the build):

1. `/` responds 200 and shows the wordmark.
2. At 375px width, `document.documentElement.scrollWidth <= 375` (no horizontal overflow).
3. With `colorScheme: 'dark'`, the body background equals the dark `--bg` (`rgb(14, 17, 20)`); with light, `rgb(242, 243, 239)`.

## Done when

- Vercel preview URL for the SP0 PR is live and shows the placeholder correctly in light and dark.
- CI is green on the PR with all six checks.
- Locally, `git commit -m "feat: x"` is rejected; a PR titled `feat: x` fails `commitlint`.
- Branch protection on `main` and `develop` is read back from the API.
- After the squash merge to `develop`, tag `v0.1.0` exists on the remote.
- Roadmap row SP0 is marked done in the same PR.

## Out of scope

Layout/nav/i18n/theme toggle (SP1), components and collections (SP2), domain/analytics (SP7), production release to `main` (the first `release/*` happens when SP1 or later is worth shipping).
