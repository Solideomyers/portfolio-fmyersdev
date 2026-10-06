# Contributing to fmyers.dev

## Setup

1. Node 24 (`.nvmrc`) and npm. Do not use pnpm or yarn.
2. `npm install`. This also installs the git hooks (`prepare` → husky). Check with `git config --get core.hooksPath` (expected `.husky/_`).
3. `npx playwright install chromium` for tests.
4. Install gitleaks (`winget install gitleaks`) so the pre-commit secrets scan runs locally. Without it the hook warns and CI still scans.

## Branches

| Branch                  | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `main`                  | Production (Vercel). Only `release/*` PRs reach it.              |
| `develop`               | Integration and default branch. Every feature/fix PR targets it. |
| `feature/sp<N>-<topic>` | One sub-project from `docs/superpowers/roadmap.md`.              |
| `fix/<desc>`            | A focused fix.                                                   |
| `release/<version>`     | Promotes `develop` to `main`.                                    |

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
- Squash merge only. The squash commit takes the **PR title** as subject and the PR body as message (repo setting), so the title must be a valid Conventional Commit.
- Update the sub-project row in `docs/superpowers/roadmap.md` in the same PR.
- Release PRs go from `release/v0.N.0` to `main`, titled `chore: release v0.N.0`, where `v0.N.0` is the `develop` tag being promoted.

## Templates

- **Commit:** `.gitmessage`, set as `commit.template` by `npm install` (`prepare`). `git commit` without `-m` opens it with types, scopes and examples. Leaving it untouched aborts the commit.
- **Pull request:** `.github/pull_request_template.md`, filled automatically when you open a PR on GitHub. Fill every section; delete the release block unless it's a release PR.

## Tags (canonical)

| Rule             | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Format           | `vMAJOR.MINOR.PATCH`, always **annotated**                                              |
| Who creates them | Only `.github/workflows/tag.yml`. Never tag by hand.                                    |
| When             | Every merge to `develop` → next `v0.N.0` (minor bump)                                   |
| Message          | `v0.N.0 — <squash commit subject>`, tagger `github-actions[bot]`                        |
| Re-runs          | A commit that already has a `v0.*` tag is skipped (idempotent)                          |
| `main`           | No new tags. A release PR promotes an existing `develop` tag and names it in its title. |
| `v1.0.0`         | Reserved for the public launch (SP7)                                                    |
| Missed tag       | Never backfilled. The sequence continues forward.                                       |

## Design rules

`docs/handoff/` is the source of truth. Tokens in `src/styles/tokens/` are verbatim copies; don't edit them. See `CLAUDE.md` → "Design fidelity".
