# SP0 Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repository that enforces its own git rules and deploys itself: Astro project with the handoff tokens, Husky/commitlint/lint-staged/gitleaks, CI, auto-tag, branch protection, Vercel previews, agent and human docs.

**Architecture:** Static Astro site, plain CSS reading the handoff tokens copied verbatim, no UI framework. Rules live in two layers: local Husky hooks for fast feedback, and GitHub Actions plus branch protection as the layer that cannot be skipped. Vercel deploys `main` to production and every other branch as a preview.

**Tech Stack:** Astro 7.3.x, TypeScript 6.0.x (pinned: `@astrojs/check` and `typescript-eslint` don't support TS 7 yet), npm 11, Node 24, ESLint 10 + typescript-eslint + eslint-plugin-astro, Prettier 3 + prettier-plugin-astro, Playwright 1.63, Husky 9, lint-staged 17, commitlint 21, gitleaks ≥ 8.19, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-06-sp0-bootstrap-design.md`

## Global Constraints
- Package manager: **npm** only. No pnpm/yarn lockfiles.
- No React, Tailwind, shadcn, UI kits or icon libraries. No Vercel adapter.
- `src/styles/tokens/*.css` and `src/styles/motion.css` are byte-identical to `docs/handoff/design/design-system/`.
- Components read only semantic tokens. Radius 0, no shadows, no emoji.
- Commit scopes: `ui, layout, i18n, content, pages, contact, motion, blog, config, ci, deps, docs`. `feat/fix/refactor/test` require one.
- Repo: `git@github.com:Solideomyers/portfolio-fmyersdev.git` (public after Task 2). `develop` is the default branch, `main` is production.
- **Commit / push / merge / GitHub or Vercel settings changes:** show the exact command or message and wait for the user's OK, unless the user grants blanket approval for this plan's commits at the start of execution. Never `--no-verify`.
- Shell: Git Bash (POSIX). Paths are relative to the repo root (Tasks 1–2) or to the worktree `.worktrees/sp0-bootstrap` (Tasks 3–10).

## Review Focus
1. **Windows line endings:** with `core.autocrlf=true`, a checkout gets CRLF, so `prettier --check` and the token byte-compare would fail locally but pass in CI. Expected: identical results on Windows and Linux. Pinned by `.gitattributes` (Task 1) and `tests/tokens.spec.ts` (Task 3).
2. **Token drift:** lint-staged or `npm run lint` reformatting the copied token files silently breaks fidelity. Expected: those files never change. Pinned by `.prettierignore` + `tests/tokens.spec.ts` (Task 3), and a lint-staged check in Task 5.
3. **PR title edited after opening:** the default `pull_request` trigger doesn't re-run on `edited`, so a fixed (or broken) title keeps a stale result. Expected: the check reruns on edit. Pinned by `types: [opened, edited, synchronize, reopened]` and the title-edit test in Task 6.
4. **PR title as shell input:** interpolating `${{ github.event.pull_request.title }}` straight into `run:` allows script injection on a public repo. Expected: the title is data. Pinned by passing it through `env:` (Task 6).
5. **Vercel production branch:** Vercel defaults production to the repo's default branch, which is `develop`. Expected: production is `main` only. Pinned by the deployment-target check in Task 7.

---

### Task 0: Prerequisites

**Files:** none

- [ ] **Step 1: Check tools**

Run:
```bash
node -v && npm -v && git --version && gh auth status && vercel whoami && gitleaks version
```
Expected: Node `v24.x`, npm `11.x`, `gh` logged in as `Solideomyers`, `vercel whoami` prints an account, gitleaks `8.19` or newer.

- [ ] **Step 2: Install what's missing (user action)**

If gitleaks is missing, ask the user to run `! winget install gitleaks` and reopen the shell. If `vercel whoami` fails, ask for `! vercel login`. If `gh` isn't logged in, ask for `! gh auth login`. Do not continue until Step 1 passes.

---

### Task 1: Initialise the repository and push `main` + `develop`

**Files:**
- Move: `design_handoff_fmyers_dev/` → `docs/handoff/`
- Create: `.gitignore`, `.gitattributes`

- [ ] **Step 1: Move the handoff**

```bash
mv design_handoff_fmyers_dev docs/handoff
ls docs
```
Expected: `handoff  superpowers`

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules/
dist/
.astro/
.vercel/
.env
.env.*
!.env.example
.worktrees/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 3: Create `.gitattributes`**

```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
*.woff2 binary
```

- [ ] **Step 4: Init and first commit (confirm with user first)**

```bash
git init -b main
git add .gitignore .gitattributes docs
git status --short | head -20
git commit -m "docs: add design handoff, roadmap and sp0 spec/plan"
```
Expected: commit created on `main`, containing `docs/handoff/**` and `docs/superpowers/**`.

- [ ] **Step 5: Push `main` and `develop` (confirm with user first)**

```bash
git remote add origin git@github.com:Solideomyers/portfolio-fmyersdev.git
git push -u origin main
git switch -c develop
git push -u origin develop
```
Expected: both branches on the remote.

- [ ] **Step 6: Repo settings (confirm with user first)**

```bash
gh repo edit Solideomyers/portfolio-fmyersdev --default-branch develop \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false \
  --delete-branch-on-merge
gh api repos/Solideomyers/portfolio-fmyersdev \
  --jq '{default_branch, allow_squash_merge, allow_merge_commit, allow_rebase_merge, delete_branch_on_merge}'
```
Expected: `{"default_branch":"develop","allow_squash_merge":true,"allow_merge_commit":false,"allow_rebase_merge":false,"delete_branch_on_merge":true}`

---

### Task 2: Scan history and make the repo public

**Files:** none

- [ ] **Step 1: Scan the full history**

```bash
gitleaks git --redact -v
```
Expected: `no leaks found`. If anything is found, STOP and report it to the user. Do not make the repo public.

- [ ] **Step 2: Make it public (confirm with user first)**

```bash
gh repo edit Solideomyers/portfolio-fmyersdev --visibility public --accept-visibility-change-consequences
gh repo view Solideomyers/portfolio-fmyersdev --json visibility --jq .visibility
```
Expected: `PUBLIC`

---

### Task 3: Worktree, Astro scaffold, tokens and placeholder page

**Files:**
- Create: `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`, `src/pages/index.astro`, `src/styles/global.css`, `src/styles/tokens/{colors,fonts,typography,spacing,motion}.css` (copied), `src/styles/motion.css` (copied), `public/wordmark-light.svg`, `public/wordmark-dark.svg`, `public/logo-light.svg`, `public/logo-dark.svg`, `playwright.config.ts`, `.prettierignore`
- Test: `tests/smoke.spec.ts`, `tests/tokens.spec.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test` (later tasks add `lint`, `lint:check`, `prepare`). Playwright `baseURL` `http://localhost:4321`.

- [ ] **Step 1: Create the worktree**

```bash
git worktree add .worktrees/sp0-bootstrap -b feature/sp0-bootstrap develop
cd .worktrees/sp0-bootstrap
```

- [ ] **Step 2: Scaffold Astro in a temp dir and copy it in**

```bash
TMP="$(mktemp -d)/astro"
npm create astro@latest "$TMP" -- --template minimal --no-install --no-git --skip-houston --yes
cp "$TMP"/package.json "$TMP"/astro.config.mjs "$TMP"/tsconfig.json .
cp -r "$TMP"/src "$TMP"/public .
cat tsconfig.json
```
Expected: `tsconfig.json` extends `astro/tsconfigs/strict`. If it extends something else, set `"extends": "astro/tsconfigs/strict"`.

- [ ] **Step 3: Set name, engines, scripts; pin Node**

Edit `package.json` so these fields read exactly (keep the `dependencies` it generated):
```json
{
  "name": "fmyers-dev",
  "type": "module",
  "private": true,
  "engines": { "node": "24.x" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "playwright test"
  }
}
```
```bash
echo 24 > .nvmrc
npm install
npm install -D @astrojs/check typescript@~6.0.3 @playwright/test
npx playwright install chromium
```
Expected: `package-lock.json` created. No pnpm or yarn lockfile.

- [ ] **Step 4: Copy tokens and brand assets verbatim**

```bash
mkdir -p src/styles/tokens
cp docs/handoff/design/design-system/tokens/*.css src/styles/tokens/
cp docs/handoff/design/design-system/motion.css src/styles/motion.css
cp docs/handoff/design/assets/*.svg public/
rm -f public/favicon.svg
```
(The favicon comes in SP1 from `logo-*.svg`.)

- [ ] **Step 5: Protect copied files from formatters — create `.prettierignore`**

```gitignore
dist
.astro
docs/handoff
src/styles/tokens
src/styles/motion.css
package-lock.json
.worktrees
test-results
playwright-report
```

- [ ] **Step 6: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 7: Write the failing tests**

`tests/tokens.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const SRC = 'docs/handoff/design/design-system';

test('token files are byte-identical to the handoff', () => {
  for (const file of readdirSync(`${SRC}/tokens`)) {
    expect(readFileSync(`src/styles/tokens/${file}`, 'utf8'), file).toBe(
      readFileSync(`${SRC}/tokens/${file}`, 'utf8'),
    );
  }
  expect(readFileSync('src/styles/motion.css', 'utf8')).toBe(
    readFileSync(`${SRC}/motion.css`, 'utf8'),
  );
});
```

`tests/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home responds 200 and shows the wordmark', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('img', { name: 'fmyers.dev' })).toBeVisible();
});

test('no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});

const schemes = [
  ['light', 'rgb(242, 243, 239)'],
  ['dark', 'rgb(14, 17, 20)'],
] as const;

for (const [scheme, bg] of schemes) {
  test(`body uses the ${scheme} --bg`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', bg);
  });
}
```

- [ ] **Step 8: Run tests to verify they fail**

Run: `npm test`
Expected: `tokens.spec.ts` PASSES (files already copied). The smoke tests FAIL: no wordmark img, and the body background is transparent (`rgba(0, 0, 0, 0)`).

- [ ] **Step 9: Write `src/styles/global.css`**

```css
/* Mirrors docs/handoff/design/design-system/styles.css.
   tokens/fonts.css is intentionally NOT imported: fonts load through <link> in the page head
   (a CSS @import of Google Fonts is a render-blocking request chain). Same families, axes and weights. */
@import './tokens/colors.css';
@import './tokens/typography.css';
@import './tokens/spacing.css';
@import './tokens/motion.css';
@import './motion.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
}
```

- [ ] **Step 10: Write `src/pages/index.astro` (token-check placeholder)**

```astro
---
import '../styles/global.css';

const colors = [
  'bg', 'surface', 'hatch', 'line', 'line-strong', 'text', 'text-muted',
  'accent', 'accent-fg', 'ok', 'danger', 'invert-bg', 'invert-fg',
];
const sizes = [
  ['display-xl', 'Display XL'], ['display-l', 'Display L'], ['h2', 'H2'], ['h3', 'H3'],
  ['h4', 'H4'], ['body-l', 'Body L'], ['body', 'Body'], ['body-s', 'Body S'],
];
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>fmyers.dev — token check</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..700&family=JetBrains+Mono:wght@500&display=swap"
    />
  </head>
  <body>
    <main>
      <picture>
        <source srcset="/wordmark-dark.svg" media="(prefers-color-scheme: dark)" />
        <img src="/wordmark-light.svg" alt="fmyers.dev" height="32" />
      </picture>
      <p class="label">SHEET 00 — TOKEN CHECK · SP0</p>
      <ul class="swatches">
        {
          colors.map((c) => (
            <li>
              <span class="swatch" style={`background: var(--${c})`} />
              <code>--{c}</code>
            </li>
          ))
        }
      </ul>
      <div class="type">
        {sizes.map(([t, name]) => <p style={`font-size: var(--fs-${t})`}>{name}</p>)}
        <p class="label">Label — JetBrains Mono 500</p>
      </div>
    </main>
  </body>
</html>

<style>
  main {
    max-width: var(--page-max);
    margin: 0 auto;
    padding: var(--space-12) var(--gutter);
  }
  img {
    display: block;
    height: 32px;
    width: auto;
  }
  .label {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .swatches {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1px;
    background: var(--line);
    border: var(--border-ink);
  }
  .swatches li {
    background: var(--surface);
    padding: var(--space-3);
    display: flex;
    gap: var(--space-3);
    align-items: center;
    font-family: var(--font-mono);
    font-size: var(--fs-label-s);
  }
  .swatch {
    flex: none;
    width: 32px;
    height: 32px;
    border: var(--border-rule);
  }
  .type p:not(.label) {
    margin: var(--space-2) 0;
    font-weight: 700;
    font-stretch: var(--stretch-display);
    line-height: var(--lh-display);
    letter-spacing: var(--ls-display);
  }
</style>
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm test && npm run check`
Expected: 5 tests pass; `astro check` reports `0 errors`.

- [ ] **Step 12: Commit (confirm with user first)**

```bash
git add -A
git commit -m "feat(config): scaffold astro with handoff tokens and token-check page"
```
(No hooks exist yet; Task 5 adds them.)

---

### Task 4: ESLint and Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc`
- Modify: `package.json` (scripts `lint`, `lint:check`)

- [ ] **Step 1: Install**

```bash
npm install -D eslint eslint-plugin-astro typescript-eslint prettier prettier-plugin-astro
```
If npm warns about missing optional peers of `eslint-plugin-astro` (`eslint-plugin-jsx-a11y*`), ignore it. There is no JSX in this project.

- [ ] **Step 2: Write `eslint.config.js`**

```js
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', 'docs/', '.worktrees/', 'test-results/', 'playwright-report/'] },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
```

- [ ] **Step 3: Write `.prettierrc`**

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
"lint": "eslint . --fix && prettier --write .",
"lint:check": "eslint . && prettier --check ."
```

- [ ] **Step 5: Verify the check fails before formatting**

Run: `npm run lint:check`
Expected: FAIL from `prettier --check`, listing scaffold files (e.g. `src/pages/index.astro`). If it already passes, continue.

- [ ] **Step 6: Format, then verify everything passes and tokens are untouched**

```bash
npm run lint
npm run lint:check && npm test
git status --short src/styles
```
Expected: `lint:check` passes, 5 tests pass, and `git status` shows no changes under `src/styles/tokens` or `src/styles/motion.css`.

- [ ] **Step 7: Commit (confirm with user first)**

```bash
git add -A
git commit -m "chore(config): add eslint and prettier"
```

---

### Task 5: Husky, commitlint, lint-staged, gitleaks hook

**Files:**
- Create: `scripts/scopes.cjs`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
- Modify: `package.json` (`prepare`)

**Interfaces:**
- Produces: `scripts/scopes.cjs` exports `string[]`, the only source of scopes (read by `commitlint.config.cjs`; mirrored in docs in Task 8).

- [ ] **Step 1: Install and init**

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
git config --get core.hooksPath
```
Expected: `package.json` has `"prepare": "husky"`; hooksPath prints `.husky/_`.

- [ ] **Step 2: Write `scripts/scopes.cjs`**

```js
// Single source of commit scopes. When this changes, update CLAUDE.md and CONTRIBUTING.md in the same commit.
module.exports = [
  'ui',
  'layout',
  'i18n',
  'content',
  'pages',
  'contact',
  'motion',
  'blog',
  'config',
  'ci',
  'deps',
  'docs',
];
```

- [ ] **Step 3: Write `commitlint.config.cjs`**

```js
const SCOPES = require('./scripts/scopes.cjs');

const TYPES_REQUIRING_SCOPE = ['feat', 'fix', 'refactor', 'test'];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', SCOPES],
    'scope-required-for-type': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'scope-required-for-type': ({ type, scope }) => [
          !TYPES_REQUIRING_SCOPE.includes(type ?? '') || Boolean(scope),
          `type "${type}" must name the affected scope: ${SCOPES.join(', ')}`,
        ],
      },
    },
  ],
};
```

- [ ] **Step 4: Verify commitlint rules**

```bash
echo "feat: add button" | npx commitlint; echo "exit=$?"
echo "feat(header): add button" | npx commitlint; echo "exit=$?"
echo "feat(ui): add button" | npx commitlint; echo "exit=$?"
echo "chore: bump astro" | npx commitlint; echo "exit=$?"
```
Expected: exit 1 with `scope-required-for-type`; exit 1 with `scope-enum`; exit 0; exit 0.

- [ ] **Step 5: Write `.lintstagedrc.json`**

```json
{
  "*.{astro,ts,js,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{css,json,md,yml,yaml}": ["prettier --write"]
}
```

- [ ] **Step 6: Write the hooks**

`.husky/pre-commit`:
```sh
npx lint-staged
npm run check
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks git --pre-commit --staged --redact
else
  echo "warning: gitleaks not installed, local secrets scan skipped (CI enforces it). Install: winget install gitleaks"
fi
```

`.husky/commit-msg`:
```sh
npx --no -- commitlint --edit "$1"
```

`.husky/pre-push`:
```sh
npm test
```

- [ ] **Step 7: Verify hooks end to end**

```bash
git add -A
git commit -m "feat: add hooks"; echo "exit=$?"
```
Expected: lint-staged and `astro check` run, then commitlint rejects it (`exit=1`), and nothing is committed.

```bash
printf '/* drift */\n' >> src/styles/tokens/colors.css && git add src/styles/tokens/colors.css
npx lint-staged; git diff --cached --stat src/styles/tokens; git checkout HEAD -- src/styles/tokens/colors.css
```
Expected: the staged diff shows exactly the one appended line, so Prettier left the rest of the file untouched. The checkout restores the file. This proves formatters never rewrite tokens.

- [ ] **Step 8: Commit (confirm with user first)**

```bash
git add -A
git commit -m "chore(config): add husky, commitlint, lint-staged and gitleaks hooks"
```
Expected: all hooks pass and the commit is created.

---

### Task 6: CI, PR-title lint and auto-tag workflows

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/pr-title.yml`, `.github/workflows/tag.yml`

**Interfaces:**
- Produces: required status check names `lint`, `check`, `build`, `test`, `commitlint`, `secrets` (job ids; Task 9 depends on them exactly).

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run lint:check

  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test

  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Write `.github/workflows/pr-title.yml`**

This lints the PR title, which is the message that survives the squash. The rulebook's `wagoid/commitlint-github-action` lints the branch commits, not the title, so the title goes through `env:` into the local config instead. Using `env:` also keeps a hostile title from being executed as shell.

```yaml
name: PR title

on:
  pull_request:
    branches: [develop, main]
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - name: Lint PR title
        env:
          TITLE: ${{ github.event.pull_request.title }}
        run: printf '%s\n' "$TITLE" | npx commitlint
```

- [ ] **Step 3: Write `.github/workflows/tag.yml`**

```yaml
name: Auto-tag

on:
  push:
    branches: [develop]

permissions:
  contents: write

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Tag next v0.N.0
        run: |
          LAST=$(git tag --list 'v0.*.0' --sort=-v:refname | head -n1)
          LAST=${LAST:-v0.0.0}
          MINOR=$(echo "$LAST" | sed -E 's/^v0\.([0-9]+)\.0$/\1/')
          NEXT="v0.$((MINOR + 1)).0"
          git tag "$NEXT"
          git push origin "$NEXT"
```

- [ ] **Step 4: Commit, push, open draft PR (confirm with user first)**

```bash
git add -A
git commit -m "ci: add ci, pr-title and auto-tag workflows"
git push -u origin feature/sp0-bootstrap
gh pr create --draft --base develop --title "feat(config): bootstrap astro, tooling, ci and vercel" \
  --body "Implements SP0 — docs/superpowers/specs/2026-10-06-sp0-bootstrap-design.md"
```
(Hooks run on commit and push; `pre-push` runs `npm test`.)

- [ ] **Step 5: Verify all six checks pass**

```bash
gh pr checks --watch
```
Expected: `lint`, `check`, `build`, `test`, `secrets`, `commitlint` all `pass`.

- [ ] **Step 6: Verify the title check fails and recovers on edit**

```bash
gh pr edit --title "feat: bootstrap"
gh pr checks --watch   # expect commitlint: fail
gh pr edit --title "feat(config): bootstrap astro, tooling, ci and vercel"
gh pr checks --watch   # expect commitlint: pass
```

---

### Task 7: Vercel project

**Files:** none in the repo (`.vercel/` is gitignored)

- [ ] **Step 1: Create the project and connect Git (confirm with user first)**

```bash
vercel link --yes --project fmyers-dev
vercel git connect
```
Expected: the project `fmyers-dev` exists, framework detected as Astro, connected to `Solideomyers/portfolio-fmyersdev`.

- [ ] **Step 2: Set production branch to `main` (user action in the dashboard)**

Ask the user to open Vercel → `fmyers-dev` → Settings → Environments → Production → Branch Tracking and set the branch to `main`. Vercel defaults it to the repo's default branch, `develop`.

- [ ] **Step 3: Trigger a preview and verify the target**

```bash
git commit --allow-empty -m "chore: trigger vercel preview"   # confirm with user first
git push
vercel ls fmyers-dev
```
Expected: the latest deployment for `feature/sp0-bootstrap` is `Preview`, not `Production`, and reaches `Ready`. Open its URL. It shows the wordmark, swatches and type scale, and switching the OS theme flips light/dark.

- [ ] **Step 4: Verify `prepare: husky` doesn't break the Vercel build**

```bash
vercel inspect <preview-url> --logs | grep -i -E "husky|error" || true
```
Expected: no error from husky; the build succeeds. If it fails because of husky, change `prepare` to `"husky || true"`, add a comment in `CONTRIBUTING.md` explaining that it's only for builds without `.git`, commit with `fix(config): tolerate missing .git in vercel builds`, and recheck.

---

### Task 8: Docs — CLAUDE.md, CONTRIBUTING.md, README.md, roadmap

**Files:**
- Create: `CLAUDE.md`, `CONTRIBUTING.md`
- Modify: `README.md` (scaffold's), `docs/superpowers/roadmap.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# fmyers.dev — rules for agents

Read first: `docs/handoff/README.md` (design source of truth) and `docs/superpowers/roadmap.md` (current sub-project and its spec/plan).

## Stack (closed)
- Astro (static output), TypeScript strict, plain CSS, vanilla TypeScript `<script>`. Package manager: **npm** only.
- Do not add React, Tailwind, shadcn, UI kits, icon libraries or CSS-in-JS without the user asking. The only optional extra the handoff allows is `motion` (vanilla).
- Every new dependency is justified in the PR description.

## Design fidelity
- The handoff is high-fidelity: copy values from `docs/handoff/`, never approximate.
- Components read only semantic tokens (`--bg`, `--surface`, `--text`, `--accent`, ...), never `--fm-*` or hex values.
- `src/styles/tokens/*.css` and `src/styles/motion.css` are byte-identical copies of the handoff. Never edit them; `tests/tokens.spec.ts` enforces it.
- Radius 0. No shadows. No gradients except the hatch. No emoji. Glyphs only: → ↗ ← — · ◐ + ✓.
- Animate only transform, opacity, clip-path, stroke-dashoffset. Reduced motion leaves only fades.
- Handoff accessibility rules are requirements: 44px touch targets, `aria-current`, `aria-pressed`, `aria-expanded`, `role="alert"`, 4.5:1 contrast.

## Git
- Branches: `main` (production), `develop` (integration, default), `feature/sp<N>-<topic>`, `fix/<desc>`, `release/<version>`.
- Every change reaches `develop` through a PR. Squash merge only. The PR title is the final commit and must be a valid Conventional Commit.
- Format `type(scope): subject`. Scopes: `ui, layout, i18n, content, pages, contact, motion, blog, config, ci, deps, docs` (source: `scripts/scopes.cjs`; change it together with this file and `CONTRIBUTING.md`). `feat`, `fix`, `refactor`, `test` require a scope.
- **Never commit, push, merge, tag, or change GitHub/Vercel settings without explicit confirmation from the user.** Propose the command or message and wait.
- Never use `--no-verify`.

## Workflow
- Each sub-project: spec in `docs/superpowers/specs/`, plan in `docs/superpowers/plans/`. Both are the first commit on the SP branch, pushed immediately with a draft PR to `develop`.
- Work in a worktree: `git worktree add .worktrees/sp<N>-<topic> -b feature/sp<N>-<topic> develop`, then `npm install` inside it.
- Update the SP row in `docs/superpowers/roadmap.md` in that SP's PR.

## Commands
`npm run dev` · `build` · `preview` · `check` · `lint` · `lint:check` · `test`
```

- [ ] **Step 2: Write `CONTRIBUTING.md`**

~~~markdown
# Contributing to fmyers.dev

## Setup
1. Node 24 (`.nvmrc`) and npm. Do not use pnpm or yarn.
2. `npm install`. This also installs the git hooks (`prepare` → husky). Check with `git config --get core.hooksPath` (expected `.husky/_`).
3. `npx playwright install chromium` for tests.
4. Install gitleaks (`winget install gitleaks`) so the pre-commit secrets scan runs locally. Without it the hook warns and CI still scans.

## Branches
| Branch | Purpose |
|---|---|
| `main` | Production (Vercel). Only `release/*` PRs reach it. |
| `develop` | Integration and default branch. Every PR targets it. |
| `feature/sp<N>-<topic>` | One sub-project from `docs/superpowers/roadmap.md`. |
| `fix/<desc>` | A focused fix. |
| `release/<version>` | Promotes `develop` to `main`. |

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

| Message | Valid? | Why |
|---|---|---|
| `feat(ui): add Button component` | yes | |
| `fix(i18n): keep scroll position on language switch` | yes | |
| `chore: bump astro` | yes | chore may omit the scope |
| `feat: add button` | no | feat needs a scope |
| `feat(header): add nav` | no | `header` is not a scope; use `layout` |

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
~~~

- [ ] **Step 3: Replace `README.md`**

~~~markdown
# fmyers.dev

Personal site of Francisco Myers. Astro, static, bilingual (EN/ES), deployed on Vercel.

- Design handoff: `docs/handoff/README.md`
- Roadmap: `docs/superpowers/roadmap.md`
- Contributing and git rules: `CONTRIBUTING.md`

```bash
npm install
npm run dev
```
~~~

- [ ] **Step 4: Update the roadmap SP0 row**

In `docs/superpowers/roadmap.md`, change the SP0 row's Status to `done (v0.1.0)` and its Plan cell to `[plan](plans/2026-10-06-sp0-bootstrap.md)`.

- [ ] **Step 5: Verify and commit (confirm with user first)**

```bash
npm run lint:check
git add -A
git commit -m "docs: add claude rules, contributing guide and update roadmap"
git push
```
Expected: hooks pass, push succeeds.

---

### Task 9: Branch protection

**Files:** none

**Interfaces:**
- Consumes: check names from Task 6: `lint, check, build, test, commitlint, secrets`.

- [ ] **Step 1: Apply protection to `main` and `develop` (confirm with user first)**

```bash
for b in main develop; do
gh api -X PUT "repos/Solideomyers/portfolio-fmyersdev/branches/$b/protection" --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["lint", "check", "build", "test", "commitlint", "secrets"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
done
```

- [ ] **Step 2: Read it back from the API**

```bash
for b in main develop; do
gh api "repos/Solideomyers/portfolio-fmyersdev/branches/$b/protection" \
  --jq '{checks: .required_status_checks.contexts, strict: .required_status_checks.strict, admins: .enforce_admins.enabled, force: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled}'
done
```
Expected for both: `{"checks":["lint","check","build","test","commitlint","secrets"],"strict":true,"admins":true,"force":false,"deletions":false}` (checks order may differ).

- [ ] **Step 3: Confirm the PR shows as mergeable only with checks**

```bash
gh pr view --json mergeStateStatus,statusCheckRollup --jq '.mergeStateStatus'
```
Expected: `CLEAN` (all six required checks passed), or `BLOCKED` while any is pending.

---

### Task 10: Merge, tag, clean up

**Files:** none

- [ ] **Step 1: Mark ready and squash-merge (confirm with user first)**

```bash
gh pr ready
gh pr merge --squash --subject "feat(config): bootstrap astro, tooling, ci and vercel" --delete-branch
```

- [ ] **Step 2: Verify the auto-tag**

```bash
gh run list --workflow tag.yml --limit 1
gh run watch "$(gh run list --workflow tag.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
git ls-remote --tags origin v0.1.0
```
Expected: run succeeds; `refs/tags/v0.1.0` exists.

- [ ] **Step 3: Update the root checkout and remove the worktree**

```bash
cd ../..                 # repo root, on develop
git pull
npm install              # installs hooks in the root checkout
git config --get core.hooksPath
git worktree remove .worktrees/sp0-bootstrap
git branch -D feature/sp0-bootstrap
git worktree list
```
Expected: hooksPath `.husky/_`; only the root worktree listed.

- [ ] **Step 4: Final verification against the spec's "Done when"**
- Preview URL showed the placeholder in light and dark (Task 7 Step 3).
- Six checks green on the PR (Task 6 Step 5).
- `feat: x` rejected locally (Task 5 Step 7) and as a PR title (Task 6 Step 6).
- Protection read back from the API (Task 9 Step 2).
- `v0.1.0` on the remote (Task 10 Step 2).
- Roadmap SP0 marked done (Task 8 Step 4).
