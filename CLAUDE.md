# fmyers.dev — rules for agents

Read first: `docs/handoff/README.md` (design source of truth) and `docs/superpowers/roadmap.md` (current sub-project and its spec/plan).

## Stack (closed)

- Astro (static output; the only on-demand route is `/api/contact` via `@astrojs/vercel`), TypeScript strict, plain CSS, vanilla TypeScript `<script>`. Package manager: **npm** only.
- Do not add React, Tailwind, shadcn, UI kits, icon libraries or CSS-in-JS without the user asking. The only optional extra the handoff allows is `motion` (vanilla).
- Every new dependency is justified in the PR description.
- Secrets (Turnstile secret, Apps Script URL/key) live only in Vercel env and Apps Script properties, typed through `astro:env`; never in the repo, client code, logs or responses.

## Design fidelity

- The handoff is high-fidelity: copy values from `docs/handoff/`, never approximate.
- Components read only semantic tokens (`--bg`, `--surface`, `--text`, `--accent`, ...), never `--fm-*` or hex values.
- `src/styles/tokens/*.css` and `src/styles/motion.css` are byte-identical copies of the handoff. Never edit them; `tests/tokens.spec.ts` enforces it.
- Radius 0. No shadows. No gradients except the hatch. No emoji. Glyphs only: → ↗ ← — · ◐ + ✓.
- Animate only transform, opacity, clip-path, stroke-dashoffset. Reduced motion leaves only fades.
- Handoff accessibility rules are requirements: 44px touch targets, `aria-current`, `aria-pressed`, `aria-expanded`, `role="alert"`, 4.5:1 contrast.

## Git

- Branches: `main` (production), `develop` (integration, default), `feature/sp<N>-<topic>`, `fix/<desc>`, `release/<version>`.
- Every change reaches `develop` through a PR. **Squash merge only into `develop`.** The PR title is the final commit and must be a valid Conventional Commit.
- **`main` only receives release PRs, merged with a merge commit** (never squash): `release/vX.Y.Z` points exactly at the `develop` commit tagged `vX.Y.Z`, with no commits of its own. `main` then holds `develop`'s real history: no divergence, no back-merges. A fix found while releasing goes to `develop` first, then the release is re-cut. Enforced by rulesets (develop: squash only; main: merge only) and the `release-source` CI job.
- Format `type(scope): subject`. Scopes: `ui, layout, i18n, content, pages, contact, motion, blog, config, ci, deps, docs` (source: `scripts/scopes.cjs`; change it together with this file and `CONTRIBUTING.md`). `feat`, `fix`, `refactor`, `test` require a scope.
- **Never commit, push, merge, tag, or change GitHub/Vercel settings without explicit confirmation from the user.** Propose the command or message and wait.
- Never use `--no-verify`.
- Templates: commits follow `.gitmessage` (also the format for messages you propose). PRs fill `.github/pull_request_template.md`, and you write the PR body from it. Release PR title: `chore: release v0.N.0`.
- Tags: annotated `vX.Y.Z`, created only by `tag.yml` on merge to `develop` (minor bump, or `Release-As: vX.Y.Z` in the PR body). Never create, move or delete tags yourself. `v1.0.0` is reserved for the launch (`Release-As` in the SP8b PR).

## Workflow

- Each sub-project: spec in `docs/superpowers/specs/`, plan in `docs/superpowers/plans/`. Both are the first commit on the SP branch, pushed immediately with a draft PR to `develop`.
- Work in a worktree: `git worktree add .worktrees/sp<N>-<topic> -b feature/sp<N>-<topic> develop`, then `npm install` inside it. Run `vercel` CLI commands from the root checkout (the CLI doesn't recognise a worktree's `.git` file).
- Update the SP row in `docs/superpowers/roadmap.md` in that SP's PR.

## Commands

`npm run dev` · `build` · `preview` · `check` · `lint` · `lint:check` · `test`
