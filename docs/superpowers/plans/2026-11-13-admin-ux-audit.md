# Admin panel UX/UI refactors (post-SP10 audit)

Source: code-level audit of `admin/src` at `develop` `310b848` (2026-11-13), run with the `impeccable` and `ui-ux-pro-max` skills. Score **15/20 (Good)**. It was read-only: the panel was **not rendered**, no screenshots, no screen-reader or touch test. The mechanical detector returned nothing.

Scores: accessibility 3, performance 3, theming 3, responsive 3, implementation integrity 3.

## How to work

- Mode is **Operate** (admin tool): scanability and consistency over expression.
- One worktree and one PR per group below, from `develop`: `git worktree add .worktrees/admin-ux-<n> -b fix/admin-<topic> origin/develop`, then `npm install` in the root and in `admin/`.
- Commit scope `admin`, type `fix` (or `refactor`). Squash into `develop`. Never commit, push or merge without the owner's confirmation (CLAUDE.md).
- Components read semantic tokens only; `src/styles/tokens/*` and `src/styles/motion.css` are never edited.
- After each PR run `impeccable audit admin` again to see the score move, and `impeccable polish` last.
- The `impeccable` design hook is enabled for this project (`.impeccable/config.json`, local consent in `config.local.json`); it takes effect in new sessions.

## PR 1: P1, before the next release

1. **44px touch targets.** `.ad-link` is 28px; `.ad-pub` and `.ad-icon-btn` are 40px on desktop. CLAUDE.md requires 44px (WCAG 2.5.8 at 24px already passes). Affects Editar, Quitar, Restaurar, Cerrar sesión, Eliminar, Descartar. CSS only; check every screen visually because rows get taller.
2. **Confirm every discard.** Review "Descartar todos los borradores", Texts and ItemEditor "Descartar borrador" act on one click; the Dashboard already asks ("¿Descartar los N?" with Sí/No, `.ad-confirm`). Reuse that pattern everywhere.

## PR 2: P2, function and navigation

3. **Theme toggle on mobile.** `ad-desk-only` hides it under 860px, so the theme cannot be changed on a phone. Show it in the header or inside the menu.
4. **Obsolete fallback screen.** `Shell.tsx` still shows "Esta sección llega en una de las siguientes tareas." for any unknown hash and highlights Panel. Replace with a "pantalla no encontrada" message and a link to the Panel; do not mark a nav item current.
5. **Focus and title on route change.** Set `document.title` per view, move focus to the `h1`, and on mobile return focus to the menu button when the menu closes (today it falls to `body`).
6. **History restore dialog.** `role="alertdialog"` is inline with no focus move, no Escape, no `aria-modal`. Use a labelled group, move focus to its heading on open, close on Escape, add `aria-controls` to the Restaurar button.

## PR 3: P2, forms and text

7. **Associate errors with fields.** `NumberInput` sets `aria-invalid` with no message; errors sit in a block at the top. Add visible text and `aria-describedby`, also for the Texts cells.
8. **Login and passkey messages.** Passkey failure reuses "El proveedor no respondió"; separate "cancelaste" from "falló". Ask for confirmation before deleting a passkey. In `Settings.tsx`, mount the `role="status"` region before filling it, and name the delete button with the passkey ("Eliminar passkey iCloud Keychain").
9. **Link names.** "Editar →", "Quitar", "Eliminar" repeat with no item in the accessible name; add it (`aria-label` or visually hidden text).
10. **Headings.** Card headers are `span.ad-k`; use `h2` in Settings, Review, History.
11. **11px labels.** `.ad-k` is 11px and doubles as the label for "Buscar" and "Nota (opcional)". Raise to 12–13px; use normal-size text for form labels.

## PR 4: P3, needs an owner decision first

12. **Motion, shadow and radius rules.** Transitions on `background-color` (`.ad-btn`, `.ad-row`, `.ad-chip`), an inset `box-shadow` as input focus/invalid style, and round `.ad-dot` conflict with CLAUDE.md ("animate only transform/opacity/clip-path/stroke-dashoffset", "no shadows", "radius 0"). The values come from the mockup `docs/mockup de referencia – Admin.html`. **Decide whether the rule or the mockup wins.** If the rule wins: focus becomes a 2px border or `border-bottom`, transitions drop to transform/opacity, dots become squares.
13. **`--ok` on light is 3.93:1** for the 12px glyph in `.ad-step`. Tokens cannot be edited, so probably leave it.
14. **Passkey sign-in ends in `location.reload()`.** Cosmetic; leave unless it bothers.

## Unverified

- Whether the "Publicar" button label (`nowrap`, 17px, `.ad-publish`) overflows at 375px. Needs a rendered check.
- No touch, screen-reader or keyboard-walk testing was done.

## Facts that held for the audit

- Contrast (computed): text on bg/surface/hatch is 4.83–6.14 in light and 5.91–7.80 in dark; input borders use ink (>15:1).
- Already good: tokens only (no hex), `aria-current`/`aria-pressed`/`aria-expanded`, `role="alert"` on errors, reduced-motion alternative on the progress bar, memoised diff and validation, autosave with visible state.
- Detector findings: none. Saved audit report: `.impeccable/audit/2026-11-13T23-06-27Z__admin.md` in the root checkout (untracked, not in git).
