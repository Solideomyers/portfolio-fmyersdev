# Contributing to fmyers.dev

## Setup

1. Node 24 (`.nvmrc`) and npm. Do not use pnpm or yarn.
2. `npm install`. This also installs the git hooks (`prepare` → husky). Check with `git config --get core.hooksPath` (expected `.husky/_`).
3. `npx playwright install chromium` for tests.
4. Install gitleaks (`winget install gitleaks`) so the pre-commit secrets scan runs locally. Without it the hook warns and CI still scans.

## Branches

| Branch                  | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `main`                  | Production (Vercel). Only `release/*` PRs reach it.  |
| `develop`               | Integration and default branch. Every PR targets it. |
| `feature/sp<N>-<topic>` | One sub-project from `docs/superpowers/roadmap.md`.  |
| `fix/<desc>`            | A focused fix.                                       |
| `release/<version>`     | Promotes `develop` to `main`.                        |

`main` and `develop` are protected: PR required, all checks green, branch up to date, no force-push.

## Worktrees

Each sub-project gets its own worktree so `develop` stays clean:

```bash
git worktree add .worktrees/sp1-shell -b feature/sp1-shell develop
cd .worktrees/sp1-shell && npm install
# ...work, push, PR...
git worktree remove .worktrees/sp1-shell   # after the merge
```

## Commit messages

Conventional Commits, checked by commitlint locally and on the PR title in CI.

`type(scope): subject`. Scopes: `ui, layout, i18n, content, pages, contact, motion, blog, config, ci, deps, docs` (from `scripts/scopes.cjs`). `feat`, `fix`, `refactor` and `test` must have a scope. Other types may omit it, but a given scope must be in the list.

| Message                                              | Valid? | Why                                   |
| ---------------------------------------------------- | ------ | ------------------------------------- |
| `feat(ui): add Button component`                     | yes    |                                       |
| `fix(i18n): keep scroll position on language switch` | yes    |                                       |
| `chore: bump astro`                                  | yes    | chore may omit the scope              |
| `feat: add button`                                   | no     | feat needs a scope                    |
| `feat(header): add nav`                              | no     | `header` is not a scope; use `layout` |

## What the hooks do

- **pre-commit:** ESLint + Prettier on staged files (lint-staged), `astro check` on the whole project, gitleaks on staged changes.
- **commit-msg:** commitlint.
- **pre-push:** `npm test` (Playwright; builds the site first).

Hooks are the fast layer. CI repeats lint, typecheck, build, tests, secrets scan and the PR-title check, and that's the layer that can't be skipped. Never use `--no-verify`.

## Pull requests and releases

- One sub-project = one PR to `develop`. Spec and plan go in the first commit.
- Squash merge only. The PR title becomes the commit, so keep it a valid Conventional Commit.
- Merging to `develop` creates the next `v0.N.0` tag automatically.
- Update the sub-project row in `docs/superpowers/roadmap.md` in the same PR.

## Design rules

`docs/handoff/` is the source of truth. Tokens in `src/styles/tokens/` are verbatim copies; don't edit them. See `CLAUDE.md` → "Design fidelity".
