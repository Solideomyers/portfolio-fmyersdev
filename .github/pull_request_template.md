<!--
TITLE = the squash commit that lands on develop. It must pass commitlint:
  type(scope): subject        e.g. feat(ui): add Button component
Release PRs (release/v0.N.0 → main): chore: release v0.N.0   (N = the develop tag being promoted)
  Merged with a MERGE COMMIT (never squash); the branch must point exactly at tag v0.N.0.
-->

## What and why

<!-- One or two sentences. Link the issue or decision if there is one. -->

## Sub-project

- SP: <!-- e.g. SP1 Shell & i18n -->
- Spec: `docs/superpowers/specs/…`
- Plan: `docs/superpowers/plans/…`

## How it was verified

<!-- Commands run and what you saw. Screenshots for UI changes. -->

## Checklist

- [ ] `npm run lint:check`, `npm run check` and `npm test` pass locally
- [ ] Tokens untouched (`src/styles/tokens/`, `src/styles/motion.css`)
- [ ] UI changes: screenshots at 1280 / 768 / 375, light and dark, compared with `docs/handoff/`
- [ ] No new dependency, or it is justified above
- [ ] Roadmap row updated (`docs/superpowers/roadmap.md`)

<!-- Release PR only — delete otherwise:
## Release
- Promotes tag: v0.N.0 (release/v0.N.0 points exactly at it; CI release-source checks)
- [ ] Preview of develop checked
- [ ] No open PRs meant for this release
-->
