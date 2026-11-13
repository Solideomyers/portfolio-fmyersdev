# SP10 Content Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the site's editable content to Supabase and add a private panel to edit, review, publish and restore it, with no code release.

**Architecture:** A revision is a JSON map `{ repoPath: fileText }` of the content files, stored in Postgres. The site's `prebuild` writes the map back to disk, so collections, components and pages are untouched. The panel edits a draft overlay (only changed files), publishes it as a new immutable revision and a database function fires the Vercel deploy hook.

**Tech Stack:** Astro 7 (site, unchanged), Postgres/Auth via Supabase, `pg_net` + Vault, React + Vite + `@supabase/supabase-js` + `yaml` + `zod` (panel only, plus `zod`/`yaml` in the shared lib), GitHub Actions, Playwright (existing runner) and `node --test` (panel logic).

**Spec:** `docs/superpowers/specs/2026-11-03-sp10-content-admin-design.md`

## Global Constraints

- Budget is zero: Supabase free plan (project `portfolio-fmyersdev`, ref `zmrhwfodvuidhxrrhbvz`), Vercel Hobby, public GitHub repo. No paid service.
- React is allowed in `admin/` only. The public site stays vanilla; `npm` is the only package manager. Every new dependency is justified in its PR.
- Public site does not change before Task 5. Visitors never wait on Supabase.
- Secrets only in Vercel env, GitHub Actions secrets/variables or Supabase Vault; never in the repo, browser, logs or responses. The anon key and project URL are public.
- `src/styles/tokens/*.css` and `src/styles/motion.css` are never edited. Panel UI: radius 0, no shadows, semantic tokens only, 44px touch targets, `aria-current`/`aria-pressed`/`role="alert"`, 4.5:1 contrast; reference `docs/mockup de referencia – Admin.html`.
- Commit format `type(scope): subject`; new scopes `admin`, `db`. Squash into `develop`; never commit, push, merge, tag or change Supabase/Vercel/GitHub settings without the owner's explicit confirmation; never `--no-verify`.
- One PR per task, branch `feature/sp10-<n>-<topic>` created with `git worktree add .worktrees/sp10-<n>-<topic> -b feature/sp10-<n>-<topic> develop`, then `npm install`. Steps marked **Owner** are done by the owner from exact instructions; the agent never performs them.
- Managed content paths (what a snapshot contains): `src/content/**`, `src/i18n/ui.en.json`, `src/i18n/ui.es.json`, `src/config/site.data.json`.

## Review Focus

- A typed value with YAML-significant characters (`: `, a leading `-`, ` #`, an unquoted comma in a flow mapping, a leading `*`) must be written quoted and parse back to the same string.
- Removing a `{{email}}`-style token from a UI string must be refused, not published.
- Editing `from` or `billing` of a package in only one language must be impossible in the editor and refused by validation if the files already disagree.
- `CONTENT_SOURCE=live` with Supabase unreachable or returning an error must fail the build with a clear message and write no partial files.
- A signed-in non-owner calling `publish`, `restore`, `draft_set_file` or reading `revisions`/`draft` must get nothing.

---

## Task 1: Shared schemas, file snapshot, UI/site JSON, fixture

**Files:**

- Create: `src/lib/content-schemas.ts`, `src/lib/snapshot.ts`, `src/lib/snapshot-fs.ts`, `scripts/content.mjs`, `src/i18n/ui.en.json`, `src/i18n/ui.es.json`, `src/config/site.data.json`, `tests/fixtures/content.snapshot.json`
- Modify: `src/content.config.ts`, `src/i18n/ui.ts`, `src/config/site.ts`, `scripts/scopes.cjs`, `CLAUDE.md` (scopes line), `CONTRIBUTING.md` (scopes), `tests/single-source.spec.ts`, `package.json` (`zod`, `yaml`)
- Test: `tests/snapshot-unit.spec.ts`

**Interfaces:**

- Produces (`content-schemas.ts`): `workSchema`, `notesSchema`, `otherWorkSchema`, `pricingSchema`, `pagesSchema`, `faqItemSchema` (`{id, page, order, q, a}`), moved verbatim from `src/content.config.ts` (which now imports them).
- Produces (`snapshot.ts`, pure, no `node:` imports): `type Files = Record<string, string>`; `isManaged(path: string): boolean`; `splitFrontmatter(text: string): { data: unknown; body: string }`; `validateFiles(files: Files): string[]` (empty array = valid; includes pricing twin parity of `id/order/from/billing/featured` and en/es key parity of the two UI JSON files).
- Produces (`snapshot-fs.ts`, node only): `readFiles(root: string): Files`; `writeFiles(files: Files, root: string): void` (writes every entry, deletes managed files that are absent).
- Produces (`scripts/content.mjs`): commands `export <out.json>` (disk → `{revision:0, files}`) and `write <in.json> [root]`.

- [ ] **Step 1: Register scopes.** Add `'admin'`, `'db'` to `scripts/scopes.cjs`, the scopes list in `CLAUDE.md` and `CONTRIBUTING.md`. Verify: `echo "feat(admin): x" | npx commitlint` exits 0.
- [ ] **Step 2: Capture the baseline.** Before touching `ui.ts`/`site.ts`, write `JSON.stringify({ ui, site })` to the scratchpad via `npx --yes tsx -e` (one-off; `tsx` is not added to `package.json`).
- [ ] **Step 3: Write failing tests** in `tests/snapshot-unit.spec.ts`:
  - `repo content validates`: `validateFiles(readFiles('.'))` equals `[]`.
  - `round trip is byte-identical`: `writeFiles(readFiles('.'), tmpDir)` produces a tree whose every managed file equals the original bytes, and `readFiles(tmpDir)` deep-equals `readFiles('.')`.
  - `ui languages have identical key paths` (flatten both JSON files).
  - `validateFiles rejects`: one pricing twin with a different `from` → message names the file; a non-token-preserving case is covered in Task 7.
  - `YAML quoting` (Review Focus 1): table of tricky strings through the Task 6 helper is added in Task 6.
- [ ] **Step 4: Run** `npx playwright test tests/snapshot-unit.spec.ts` → FAIL (modules missing).
- [ ] **Step 5: Extract schemas** into `content-schemas.ts` importing `z` from `zod`; `content.config.ts` imports them. Run `npm run check` and `npm run build`; if Astro rejects a schema from a separate `zod` instance, import `z` from `astro/zod` in the shared file and let the panel resolve it through its own alias (decide and note in the PR).
- [ ] **Step 6: Convert UI and site values.** Write `ui.en.json`/`ui.es.json` from the baseline, replacing `site.email` uses (8 places in `ui.ts`) with `{{email}}` and `{{EMAIL}}` (uppercase variant). `ui.ts` keeps `interface Ui`, imports the JSON, applies `fillTokens` (existing `src/lib/tokens.ts`) deeply with `{ email, EMAIL }`, and exports the same `ui: Record<Lang, Ui>` (cast through `unknown`; the parity test replaces the lost compile-time check). Move `rev`, `availableFrom`, `email`, `whatsapp`, `github`, `linkedin` into `site.data.json`; `site.ts` spreads it and keeps `url` and `analytics` (env-derived). Update `single-source.spec.ts` to skip `site.data.json`.
- [ ] **Step 7: Prove nothing changed.** Re-dump `{ ui, site }` and `diff` against the Step 2 file (identical). Run `npm run build` and `npm test`.
- [ ] **Step 8: Implement** `snapshot.ts`, `snapshot-fs.ts` (managed-path listing by walking the four managed locations), `scripts/content.mjs` (Node 24 strips types; import the `.ts` modules with explicit extensions, or fall back to `npx tsx` if `tsc` rejects them). Generate `tests/fixtures/content.snapshot.json` with `node scripts/content.mjs export tests/fixtures/content.snapshot.json`.
- [ ] **Step 9: Run** Step 4 command → PASS; `npm run lint:check`, `npm run check`, `npm test` pass.
- [ ] **Step 10: Propose the commit** (`feat(content): store content as a file snapshot with shared schemas`) and wait for confirmation.

## Task 2: Database schema, Auth and RLS

**Files:**

- Create: `supabase/migrations/20261110000000_content_admin_schema.sql`, `supabase/tests/security.sql`
- Test: `supabase/tests/security.sql` (plain SQL asserts, run through the Supabase MCP `execute_sql`)

**Interfaces:**

- Produces tables: `private.owner(email text primary key)`; `public.revisions(id bigint generated always as identity primary key, created_at timestamptz default now(), kind text check (kind in ('import','publish','restore')), restored_from bigint, note text, summary text, snapshot jsonb not null)`; `public.current_revision(singleton boolean primary key default true check (singleton), revision_id bigint references revisions)`; `public.draft(singleton boolean primary key default true check (singleton), files jsonb not null default '{}')` where a `null` value means "delete this file".
- Produces function `public.is_owner() returns boolean` (security definer; true when `auth.jwt()->>'email'` equals the single `private.owner` row and the email is verified).
- RLS enabled on all three public tables, `select` for owner only; no insert/update/delete policies on `revisions` and `current_revision`; a trigger raises on any `update`/`delete` of `revisions`.

- [ ] **Step 1: Owner** — Supabase dashboard: Auth → disable "Allow new users to sign up"; invite the owner's email (creates the user); enable GitHub and Google providers; confirm the email provider (magic link) is on.
- [ ] **Step 2: Write `security.sql`** asserting, per role simulated with `set local role` + `set local request.jwt.claims`: owner can `select` the three tables; a second authenticated user gets zero rows from each and errors on any write; `anon` gets zero rows and errors on any write; `update revisions` raises even for the owner.
- [ ] **Step 3: Write the migration** (tables, `private` schema not exposed, `is_owner`, RLS policies, immutability trigger, one `insert into private.owner` using a placeholder the Owner replaces).
- [ ] **Step 4: Owner confirms**, then apply with MCP `apply_migration`; run `security.sql` with `execute_sql`; expected: every assertion passes, script ends with `select 'ok'`.
- [ ] **Step 5: Propose the commit** (`feat(db): add content tables with owner-only access`).

## Task 3: Publish and restore functions, deploy hook, REV 1

**Files:**

- Create: `supabase/migrations/20261110000100_content_admin_functions.sql`, `supabase/tests/publish.sql`
- Modify: `scripts/content.mjs` (add `import`), `.env.example` (document `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for the one-time import)
- Test: `supabase/tests/publish.sql`

**Interfaces:**

- Produces (all `security definer`, `search_path` pinned): `get_current_snapshot() returns jsonb` (`{revision, files}`, granted to `anon`); `draft_set_file(p text, c text) returns void` (stores `c`, or removes the key when `c` equals the current content; `c` null stores a deletion); `draft_discard() returns void`; `publish(p_note text default null) returns bigint` (errors on empty draft or non-owner; builds the snapshot as current files merged with the draft, dropping nulls; inserts a `publish` revision with `summary` = comma-separated changed paths; moves the pointer; clears the draft; fires the hook); `restore(p_revision bigint) returns bigint` (copies that snapshot into a new `restore` revision, moves the pointer, leaves the draft untouched, fires the hook); `import_snapshot(p_files jsonb) returns bigint` (allowed for the owner or `service_role`; kind `import`).
- Hook: `net.http_post(url := vault secret 'deploy_hook_url')`, skipped silently when the secret is absent.

- [ ] **Step 1: Write `publish.sql`** asserting: `import_snapshot` creates revision 1 and the pointer; `draft_set_file` then `publish` makes revision 2 containing the edit and an untouched file, and empties the draft; `publish` with an empty draft raises; `restore(1)` creates revision 3 equal to revision 1 and keeps a pending draft; a null draft value deletes the file in the next snapshot; as a second user and as `anon`, every function except `get_current_snapshot` raises (Review Focus 5).
- [ ] **Step 2: Write the migration** implementing the interfaces above.
- [ ] **Step 3: Owner** — create the Vercel deploy hook for branch `main` of the site project; store its URL as Vault secret `deploy_hook_url`; put the service-role key in a local `.env` (gitignored, used only for Step 5).
- [ ] **Step 4: Owner confirms**, apply with `apply_migration`, run `publish.sql` (it runs inside a transaction that is rolled back) → `select 'ok'`.
- [ ] **Step 5: Implement `import`** in `scripts/content.mjs`: reads the managed files with `readFiles`, calls `rpc/import_snapshot` with the service-role key; run it once. Verify: `node scripts/content.mjs pull-live /tmp/x` (added in Task 4) later reproduces the repo files; for now `select jsonb_object_keys(snapshot) from revisions where id = 1` lists every managed path.
- [ ] **Step 6: Propose the commit** (`feat(db): add publish, restore and deploy-hook functions`).

## Task 4: Prebuild materialiser (site still reads committed files)

**Files:**

- Modify: `scripts/content.mjs` (add `pull`), `package.json` (`prebuild`, `predev` scripts), `.github/workflows/ci.yml` (assert step), `vercel.json` (CORS + no-store for `/rev.json`)
- Create: `public/rev.json` is generated, so only `.gitignore` gets `public/rev.json`
- Test: `tests/content-pull-unit.spec.ts`

**Interfaces:**

- Produces: `pull(root?: string)` writing the files and `public/rev.json` (`{ "rev": number }`). Source from env `CONTENT_SOURCE`: `fixture` (default; reads `tests/fixtures/content.snapshot.json`, rev `0`) or `live` (GET `${SUPABASE_URL}/rest/v1/rpc/get_current_snapshot` with `apikey: SUPABASE_ANON_KEY`). Live must call `validateFiles` and write nothing if it fails or the request does not return 200.

- [ ] **Step 1: Write failing tests:** `fixture pull writes exactly the committed files` (pull into a temp root and compare with `readFiles('.')`); `live pull with a failing fetch exits non-zero and writes nothing` (inject a stub server on a local port via `SUPABASE_URL`); `live pull with an invalid snapshot writes nothing` (Review Focus 4).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `pull`** and wire `"prebuild": "node scripts/content.mjs pull"`, `"predev": "node scripts/content.mjs pull"`.
- [ ] **Step 4: CI:** after `npm run build`, add a step `git diff --exit-code -- src/content src/i18n src/config/site.data.json` (generated files must equal the committed ones).
- [ ] **Step 5: Verify:** `npm run build` then the diff command above is empty; `npm test` passes.
- [ ] **Step 6: Propose the commit** (`feat(config): generate content files before every build`).

## Task 5: Cutover

**Files:**

- Modify: `.gitignore`, `docs/superpowers/roadmap.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml` (remove the Task 4 assert)
- Delete (from git): all managed paths

- [ ] **Step 1: Owner** — Vercel site project env: `CONTENT_SOURCE=live`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` for Production and Preview.
- [ ] **Step 2:** `git rm -r --cached` the managed paths, add them to `.gitignore`, drop the CI assert. Document in `CONTRIBUTING.md`: content lives in Supabase; tests use the fixture; how to refresh the fixture (`node scripts/content.mjs export tests/fixtures/content.snapshot.json`).
- [ ] **Step 3: Verify locally** with `CONTENT_SOURCE=live npm run build` and `npm test` (fixture) both green.
- [ ] **Step 4: Verify on the PR preview:** it builds from Supabase; open it beside production and compare Home, Pricing, one case study and Contact in both languages (same text, prices, images).
- [ ] **Step 5: Propose the commit** (`refactor(content): build the site from the supabase snapshot`). After merge and the owner's release, confirm production shows REV 1 in `/rev.json`.

## Task 6: Panel scaffold, sign-in, shell (S0)

**Files:**

- Create: `admin/package.json`, `admin/index.html`, `admin/vite.config.ts`, `admin/tsconfig.json`, `admin/src/main.tsx`, `admin/src/supabase.ts`, `admin/src/Login.tsx`, `admin/src/Shell.tsx`, `admin/src/admin.css`
- Modify: `.github/workflows/ci.yml` (`admin` lint/check/build), `eslint.config.*`/prettier ignores if needed
- Test: `admin/src/lib/yaml-edit.test.ts` (created in Task 7; this task only needs `node --test` wiring: `"test": "node --test src"`)

**Interfaces:**

- Produces: `supabase` client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; `signIn(provider: 'github' | 'google'): Promise<void>`; `sendMagicLink(email: string): Promise<void>`; `requireOwner(): Promise<boolean>` (calls `rpc('is_owner')`; on false it signs out and the login shows the rejected state from the mockup, `role="alert"`).
- Shell: nav items Panel / Contenido / Publicar / Historial / Ajustes with `aria-current`, a header with live REV and a "Publicar · n" button, light/dark toggle; styling copies the mockup's `ad-*` classes using the site's token files imported by relative path (`vite.config.ts` `server.fs.allow` includes the repo root).

- [ ] **Step 1: Owner** — create a second Vercel project from this repo with Root Directory `admin` and "Include source files outside of the Root Directory" enabled; env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; add the project's URL to Supabase Auth redirect URLs.
- [ ] **Step 2: Scaffold** with Vite + React + TypeScript; add `react`, `react-dom`, `@supabase/supabase-js`, `vite` and `@vitejs/plugin-react`; justify each in the PR.
- [ ] **Step 3: Implement** the interfaces and S0/shell to match the mockup at 1280 and 375, both themes.
- [ ] **Step 4: Verify manually:** owner signs in with GitHub; a different Google account lands on the rejected state and ends signed out; `npm run build` in `admin/` passes; screenshots compared with the mockup.
- [ ] **Step 5: Propose the commit** (`feat(admin): add the panel scaffold with owner-only sign-in`).

## Task 7: Dashboard, content browser, generic editor (FAQ, pricing, site facts)

**Files:**

- Create: `admin/src/lib/api.ts`, `admin/src/lib/yaml-edit.ts`, `admin/src/lib/twins.ts`, `admin/src/lib/fields.ts`, `admin/src/Dashboard.tsx`, `admin/src/Explorer.tsx`, `admin/src/ItemEditor.tsx`
- Test: `admin/src/lib/yaml-edit.test.ts`, `admin/src/lib/twins.test.ts`, `admin/src/lib/fields.test.ts`

**Interfaces:**

- `api.ts`: `loadWorking(): Promise<{ revision: number; current: Files; draft: Record<string, string | null>; working: Files }>`; `saveFile(path: string, text: string | null): Promise<void>` (→ `rpc('draft_set_file')`); `discardDraft(): Promise<void>`.
- `yaml-edit.ts`: `editFrontmatter(fileText: string, patch: Record<string, unknown>): string` (uses `yaml` `parseDocument`; keeps comments, key order and body; strings that need quotes are quoted).
- `twins.ts`: `SHARED_KEYS: Record<'pricing' | 'work' | 'faq', string[]>` (pricing: `id, order, from, billing, featured`); `twinPath(path: string): string` (`/en/` ↔ `/es/`, `en.json` ↔ `es.json`); `applyEdit(files: Files, path: string, key: string, value: unknown): Files` (a shared key writes both twins, any other key writes one).
- `fields.ts`: `formFields(schema): Field[]` built from `z.toJSONSchema(schema)` — string → input or textarea (long), number, boolean, enum → select, string array → one item per line, nested object → group.

- [ ] **Step 1: Write failing tests:**
  - `yaml-edit`: for each of `["a: b", "- x", "# c", "Fast, cheap", "*star", "\"q\"", "multi\nline"]` setting `name` then parsing the result gives the same string, and the body and an existing comment are unchanged (Review Focus 1).
  - `twins`: `applyEdit` on `from` updates both pricing files; on `name` only one; `validateFiles` still returns `[]` after an edit and returns a message when only one twin is changed by hand (Review Focus 3).
  - `fields`: the pricing schema yields `from` as number, `billing` as select with `project|month`, `includes` as a string list.
- [ ] **Step 2: Run** `cd admin && npm test` → FAIL. **Step 3: Implement** the three lib modules. **Step 4: Run** → PASS.
- [ ] **Step 5: Implement screens** S1 (draft count, last revision from `revisions`, drafted files list with "Editar →" and "Descartar todos"), S2 (collections list with draft markers: Precios, Proyectos, Otros trabajos, Preguntas frecuentes, Textos, Datos del sitio), and `ItemEditor` with ES/EN side by side, autosave (debounce 600 ms → `saveFile`), "Publicado · sin cambios"/"Borrador" tag and per-item discard. FAQ, pricing (price applies to both languages, shows how it will read) and site facts (`site.data.json`) are the first three.
- [ ] **Step 6: Verify manually** on the real project: edit a price, see the draft marker, reload and the draft persists, discard restores the published value; a second browser tab edit does not corrupt (last write wins, accepted).
- [ ] **Step 7: Propose the commit** (`feat(admin): edit faq, pricing and site facts as drafts`).

## Task 8: UI texts editor (S3c)

**Files:** Create `admin/src/Texts.tsx`, `admin/src/lib/texts.ts`; Test `admin/src/lib/texts.test.ts`

**Interfaces:**

- `texts.ts`: `flatten(tree: unknown): Record<string, string>` (dot paths, array indexes as `[n]`); `setLeaf(fileText: string, path: string, value: string): string` (rewrites the JSON file, 2-space indent, preserving all other leaves); `tokenErrors(before: string, after: string): string[]` (every `{{name}}` in `before` must still be in `after`).

- [ ] **Step 1: Write failing tests:** `flatten` of a nested sample; `setLeaf` changes one leaf and nothing else; `tokenErrors('Write to {{email}}', 'Write to us')` returns one message, and `[]` when the token is kept (Review Focus 2).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Screen:** grouped by top-level section, search box, "Sin traducir" filter (empty value in either language), ES/EN pair per key, inline error when `tokenErrors` is non-empty (blocks saving that leaf).
- [ ] **Step 6: Verify manually:** edit one nav label, confirm only `ui.*.json` changes in the draft; removing a token shows the error. **Step 7: Propose the commit** (`feat(admin): edit page and interface texts`).

## Task 9: Project and other-work data editor (S3b-lite)

**Files:** Create `admin/src/Projects.tsx`, `admin/src/lib/blank.ts`; Test `admin/src/lib/blank.test.ts`

**Interfaces:** `blankFor(collection: 'work' | 'otherWork', n: number): Files` (new file pair/entry with schema-valid defaults and the next id `FM-nn`/`OW-nn`; `validateFiles` returns only the expected "empty required text" errors); removal writes `saveFile(path, null)` for each file of the item.

- [ ] **Step 1: Write failing test:** a blank project passes the schema except for fields the owner must fill, and its id is the next free `FM-nn`.
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5: Screen:** list with "Agregar proyecto" / "Quitar", frontmatter fields from `formFields(workSchema)` (summary, client, status, timeline, metrics…), the MDX narrative as a plain `<textarea>` (monospace) per language. Cover/shot paths are text fields (images stay in git).
- [ ] **Step 6: Verify manually:** open FM-01, change nothing, confirm the draft stays empty (round trip unchanged); edit `timeline` in ES only; add a project and remove it again. **Step 7: Propose the commit** (`feat(admin): edit project and other-work data`).

## Task 10: Review, publish, progress (S5, S5b)

**Files:** Create `admin/src/Review.tsx`, `admin/src/Progress.tsx`, `admin/src/lib/diff.ts`; Modify `admin/src/lib/api.ts`; Test `admin/src/lib/diff.test.ts`

**Interfaces:**

- `diff.ts`: `diffFiles(current: Files, working: Files): { path: string; kind: 'changed' | 'added' | 'removed'; removed: string[]; added: string[] }[]` (changed lines only).
- `api.ts`: `publish(note?: string): Promise<number>` (REV number); `waitForLive(rev: number, siteUrl: string, opts?: { timeoutMs?: number }): AsyncIterable<'building' | 'live' | 'timeout'>` polling `${siteUrl}/rev.json` every 5 s with a cache-busting query, default timeout 300000 ms.

- [ ] **Step 1: Write failing tests:** `diffFiles` for a one-line change, an added file and a removed file; `waitForLive` with an injected fetch that returns `rev-1` twice then `rev` yields `building, building, live`, and with a never-matching fetch and a short timeout yields `timeout`.
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5: Screens:** S5 shows the diff per file, `validateFiles(working)` result as the checklist, a simplified preview (price card and FAQ entry rendered from the parsed working files, ES/EN toggle), an optional note and "Publicar n cambios →" disabled while any validation error exists; S5b shows the steps (Validar, Guardar versión, Marcar como actual, Reconstruir, En vivo), the "no se inició" state with a link to the Vercel dashboard after the timeout, and a link to the live site.
- [ ] **Step 6: Verify end to end on the real project** (owner confirms first): edit one FAQ answer, publish, watch S5b reach "en vivo" and `https://<site>/rev.json` show the new REV; then force a failing build (a draft file with an invalid enum) and confirm the old site stays live and S5b ends in the timeout state.
- [ ] **Step 7: Propose the commit** (`feat(admin): review changes and publish with progress`).

## Task 11: History and restore (S6)

**Files:** Create `admin/src/History.tsx`; Modify `admin/src/lib/api.ts`

**Interfaces:** `listRevisions(): Promise<{ id: number; created_at: string; kind: string; note: string | null; summary: string | null; restored_from: number | null }[]>`; `restore(id: number): Promise<number>`.

- [ ] **Step 1: Implement** the list (current marked, restored entries flagged "Vuelve a REV n"), a confirm dialog with the mockup's copy, and `restore` followed by the Task 10 progress screen.
- [ ] **Step 2: Verify manually:** restore the previous revision, confirm the site shows the old value after the rebuild and that a pending draft survives; restore again to return.
- [ ] **Step 3: Propose the commit** (`feat(admin): browse history and restore a revision`).

## Task 12: Settings and passkeys (S7)

**Files:** Create `admin/src/Settings.tsx`

- [ ] **Step 1: Gate.** In the Supabase dashboard/docs confirm passkeys are available on the free plan for this project. If not, skip Steps 2–3, hide the passkey controls, and record in the PR that passkeys are blocked.
- [ ] **Step 2: Implement** passkey registration and sign-in with the `/passkeys` API of the Auth server (registration requires an open session), the account card (owner email, current provider), sign-out, and the backup/keep-alive card reading `revisions`' latest `created_at` and the backup branch's last commit date from the public GitHub API.
- [ ] **Step 3: Verify manually:** register a passkey, sign out, sign in with it.
- [ ] **Step 4: Propose the commit** (`feat(admin): add settings and passkey sign-in`).

## Task 13: Nightly backup and keep-alive

**Files:** Create `.github/workflows/content-backup.yml`, `docs/content-backup-README.md`; Modify `docs/superpowers/roadmap.md` (SP10 row to done), `CLAUDE.md` (stack note: React allowed in `admin/` only)

**Interfaces:** the workflow checks out the default branch for `scripts/content.mjs`, checks out (or creates, orphan) `content-backup` into `backup/`, runs `node scripts/content.mjs pull backup/` with `CONTENT_SOURCE=live`, copies the README, commits only when something changed (`git diff --quiet`), pushes with `permissions: contents: write`.

- [ ] **Step 1: Owner** — add repository variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (public values).
- [ ] **Step 2: Write the workflow** (cron `17 3 * * *`, plus `workflow_dispatch`); the pull itself is the keep-alive request.
- [ ] **Step 3: Verify:** run it manually; `content-backup` appears with the files and the README; running it again produces no commit. Restore path: `node scripts/content.mjs export` run against a checkout of `content-backup` yields a snapshot equal to the live one, and `import` loads it into a new project (steps documented in the README).
- [ ] **Step 4: Update** the roadmap row and `CLAUDE.md`. **Step 5: Propose the commit** (`ci(ci): back up the published content nightly`).

---

## Self-review

- **Spec coverage:** file-map revisions (T1–T3), reused schemas (T1), draft overlay (T3, T7), access/RLS and sign-up lock (T2), publish/restore/hook (T3), build path and fixture (T4–T5), screens S0–S3, S3c, S3d, S5, S5b, S6, S7 (T6–T12), backup and keep-alive (T13), risks (free plan: T13; passkey availability and sign-ups-disabled OAuth: gates in T2/T12). Cut items (images, rich editor, notes/legal, conflicts, build logs) have no task by design.
- **Spec deviation to confirm:** the spec says "one draft (the whole working copy)"; this plan stores the draft as an overlay of edited files so a restore never overwrites unrelated drafted work. The spec is updated to match.
- **Type consistency:** `Files`, `validateFiles`, `readFiles`/`writeFiles`, `draft_set_file`, `get_current_snapshot`, `publish`, `restore`, `import_snapshot`, `saveFile`, `waitForLive` are named identically wherever used.
- **Proportion:** the plan is ~3× the spec, mostly signatures, test names and verification commands.
