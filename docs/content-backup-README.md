# content-backup

Automatic copy of the **published** content of fmyers.dev. Do not edit or merge this branch: the
`Content backup` workflow on `develop` rewrites it every night (03:17 UTC) and commits only when
the published revision changed (`backup: REV 0043`).

It exists because the free Supabase plan has no point-in-time recovery. The same nightly request
also keeps the free project from pausing for inactivity.

## What is here

The files exactly as the site reads them (`src/content/`, `src/i18n/ui.{en,es}.json`,
`src/config/site.data.json`) plus `public/rev.json`. Drafts that were never published are not
included.

## Restore into a new Supabase project

1. Create the project and apply the migrations of the repo, in order (`supabase/migrations/*.sql`),
   in the SQL editor or with the Supabase CLI.
2. Check out this branch and add a `.env` with the new project's `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (secret; never commit it).
3. From that checkout, run the importer from a clone of the repo's default branch (it needs its
   dependencies installed):

   ```bash
   git clone --branch content-backup https://github.com/Solideomyers/portfolio-fmyersdev.git backup
   cd backup
   printf 'SUPABASE_URL=...\nSUPABASE_SERVICE_ROLE_KEY=...\n' > .env
   node <path-to-repo>/scripts/content.mjs import
   ```

   `import` validates the files and loads them as revision 1 of the new project.

4. Point the admin panel (`VITE_SUPABASE_*`) and the repository variables (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`) at the new project, add the owner account again and re-enable sign-in
   providers and passkeys (passkeys must be registered again).

To only inspect a past state, `git log content-backup` lists every revision and
`git show <commit>:src/config/site.data.json` reads any file at that point.
