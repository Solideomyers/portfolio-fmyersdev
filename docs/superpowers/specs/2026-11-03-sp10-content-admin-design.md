# SP10 — Content admin panel: design

Status: approved by the owner on 2026-11-10 (lean version). Budget is zero: Supabase free plan (project `portfolio-fmyersdev`, ref `zmrhwfodvuidhxrrhbvz`, `us-east-1`), Vercel Hobby, public GitHub repo. The site earns nothing, so every piece below must justify itself; anything not listed is out.

## Intent

Changing a price, a project fact or a page text means editing files, a PR and a release. It is informational text, not logic or design. SP10 moves the content to Supabase and adds a private panel to edit it, preview it, publish it and undo a publish in one click, with no code release.

## Goals / non-goals

- Goals: edit prices, FAQ, site facts, UI texts and project data from a panel; one draft, review, publish, one-click restore. Public site stays static and as fast as today. Nothing edited in two places.
- Non-goals (v1): image management (images stay in git), rich-text/MDX editor (a plain textarea), notes and legal pages (until the blog is on), design tokens, more than one user, conflict resolution between tabs, full-fidelity preview, instant publish (a publish rebuilds the site in ~1–2 min; visitors never wait), build logs inside the panel.
- Anti-goal: the panel costs more work than it saves.

## Decisions (owner)

Custom panel on Supabase; React + Vite SPA in `admin/`, same repo, own Vercel project; sign-in with GitHub, Google, magic link and passkey (passkey last, availability unverified); one authorised account; simplified preview; one-click restore; static site, rebuild on publish; backup as files on a `content-backup` branch; `site.rev` stays an editable field (the panel's `REV 0043` counter is separate). Visual reference: `docs/mockup de referencia – Admin.html` informs behaviour and look; this document wins.

## Design

**Content = the same files, stored in Postgres.** A revision's snapshot is a JSON map `{ "src/content/pricing/en/p-01-saas-mvp.md": "<file text>", … }`, plus the UI strings and site facts as JSON files (`ui.ts` values move to `src/i18n/ui.en.json` / `ui.es.json`; `ui.ts` keeps the types and loads them). The build writes the map back to disk, so collections, components and pages do not change. The importer (files → map) and the generator (map → files) are therefore trivially exact.

**Schemas:** the existing Zod schemas in `src/content.config.ts` move to one importable module used by the site and the panel (no workspace package). The panel builds its forms from them and validates before publishing; the site build validates again and fails hard (previous deployment stays live).

**Tables:** `private.owner(email)`; `revisions(id identity = REV number, created_at, kind import|publish|restore, restored_from, note, snapshot jsonb)`, immutable; `current_revision(revision_id)` singleton; `draft(files jsonb)` singleton, an overlay holding only the edited files (a `null` value deletes a file), so a restore never overwrites unrelated drafted work. Publish and restore are Postgres functions (owner only, one transaction): publish inserts the draft as a new revision and moves the pointer; restore copies an old snapshot into a new revision. Both then fire the Vercel deploy hook via `pg_net`, URL kept in Vault. `get_current_snapshot()` (security definer) is the only thing `anon` can call.

**Access:** Auth with sign-ups disabled and the owner created once; RLS on every table through `is_owner()`; no insert/update policy on `revisions` or `current_revision`; no service-role key outside Supabase. One runnable check proves a second account reads and writes nothing.

**Build:** `prebuild` calls `get_current_snapshot()` with the anon key (or reads a committed fixture when `CONTENT_SOURCE=fixture`, used by CI and tests so a real price edit never breaks CI), validates, writes the files and `rev.json`. The panel's "publishing" screen polls `rev.json` until it shows the new REV; after 5 minutes it links to the Vercel dashboard. Supabase down at build = build fails, old site stays.

**Backup / keep-alive:** one nightly GitHub Action reads `get_current_snapshot()` (database activity keeps the free project from pausing) and commits the materialised files to `content-backup`, with a README on purpose and restore. No tokens beyond the built-in `GITHUB_TOKEN`.

**Screens (from the mockup):** S0 sign-in (incl. rejected), S1 dashboard, S2 content browser, S3 item editor (generic; pricing applies price/billing to both languages), S3c UI texts (search, missing translation, placeholder `{x}` must survive), S3d site facts, S5 review (diff + simplified preview + validation) and S5b progress, S6 history with restore, S7 settings (passkeys, session, backup status). S4 media and S3b rich editor are cut.

## Risks and limits to verify

Free plan: project pause on inactivity (mitigated by the nightly job), no point-in-time recovery (hence the backup), small Storage/API quotas (Storage unused). GitHub disables scheduled workflows after 60 days without repo activity (S7 shows last run). To verify during implementation: OAuth works with sign-ups disabled for the existing user, identities link by verified email, passkeys are enabled.

## Deliveries (one PR each, squash to `develop`; the public site does not change before 3b)

Owner steps are done by the owner; the agent never changes Vercel/GitHub/Supabase settings. New commit scopes `admin` and `db` are registered in 1 (`scripts/scopes.cjs`, `CLAUDE.md`, `CONTRIBUTING.md`). Each merge auto-tags a minor version; production is cut only when the owner decides.

| #   | Delivery                                                                                                                                                 | Done when                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Shared schemas module, `ui` values to JSON, file-map importer/generator, fixture snapshot, new scopes                                                    | Generator output equals the repo's content files exactly; CI green                                  |
| 2a  | Migration (tables, owner, immutability), Auth + RLS, `is_owner()`. **Owner:** disable sign-ups, create user                                              | Security check passes: second account and anon get nothing                                          |
| 2b  | `get_current_snapshot`, `publish`, `restore`, deploy hook via `pg_net`/Vault. **Owner:** create the hook, store its URL. Import current content as REV 1 | A test publish rebuilds a preview; REV 1 generates the repo's files                                 |
| 3a  | `prebuild` materialiser + fixture mode; CI asserts generated files equal committed ones                                                                  | Zero diff                                                                                           |
| 3b  | **Cutover:** generated paths ignored, committed content removed, `rev.json`. **Owner:** Vercel env                                                       | Production builds from Supabase; HTML equal to the previous build apart from timestamps             |
| 4a  | `admin/` scaffold, tokens, shell, S0. **Owner:** second Vercel project                                                                                   | Owner signs in; another account is rejected                                                         |
| 4b  | S1, S2 and the generic editor with draft autosave: FAQ, pricing, site facts                                                                              | Edit, autosave, discard work; price applies to both languages                                       |
| 4c  | S3c UI texts editor                                                                                                                                      | A removed placeholder is refused                                                                    |
| 4d  | Project and other-work data editor (textarea for the narrative)                                                                                          | A case study round-trips unchanged                                                                  |
| 4e  | S5 review + S5b progress: full publish path                                                                                                              | A real change goes draft → live, verified via `rev.json`; a forced build failure keeps the old site |
| 4f  | S6 history and restore                                                                                                                                   | Restore republishes and is itself restorable                                                        |
| 4g  | S7 settings and passkeys                                                                                                                                 | Passkey registered and used to sign in                                                              |
| 5   | Nightly backup/keep-alive workflow, `content-backup` README, roadmap row, `CLAUDE.md` stack note (React allowed in `admin/` only)                        | A publish shows on the branch by next morning; restore tested into an empty project                 |

PR descriptions justify each new dependency (React, Vite, Supabase client).
