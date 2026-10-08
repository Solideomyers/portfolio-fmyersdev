# SP6 Motion — design

**Status:** approved in conversation 2026-10-07, revised after a motion audit (design-taste + animation-opportunity gate) · **Branch:** `feature/sp6-motion` · **Release:** v0.7.0

## Goal

Implement the remaining interactions of the handoff motion spec (`docs/handoff/design/fmyers.dev Motion Spec.dc.html`, README "Interactions and motion") so the handoff QA motion checklist passes. Motion is "measured, like a plotter drawing": short, purposeful, never looping, never blocking input. This is a professional portfolio for people deciding whether to hire, so every animation must name its purpose (feedback, spatial consistency, state change, or delight on a rare moment) and never move content the visitor is reading.

## Scope

Already shipped in SP1–SP5 (verify, don't rebuild): D01 press, D02 hover, D09 sending, D10 field error, D16 pagination (hover only), D17 FAQ, D18 TOC marker.

In SP6, ordered by leverage:

| #   | Interaction                 | Purpose                                         | Frequency               |
| --- | --------------------------- | ----------------------------------------------- | ----------------------- |
| D05 | Card → case morph           | Spatial consistency                             | Occasional              |
| D11 | Confirmation                | Success feedback                                | Rare                    |
| D03 | Home signature              | Identity on first impression                    | Rare (once per session) |
| D06 | Theme reveal                | State change from its trigger                   | Rare                    |
| D07 | Language swap               | Avoids a jarring change; keeps reading position | Rare                    |
| D08 | Mobile menu                 | Spatial consistency                             | Occasional              |
| D04 | Home project cards entrance | Group entrance on first impression              | Occasional              |
| D15 | 404 drawing                 | Delight on a dead end                           | Rare                    |

Dropped by the owner (2026-10-07), because a professional portfolio can't afford UX anti-patterns or motion that adds no value:

- **D12 copy-email toast.** It needs new UI not on any screen, and the channel row is a single link, so a copy button inside it would nest interactive elements. The `mailto:` link stays.
- **D13 live ruler.** The ruler isn't sticky on the screens, so the indicator would only move while the hero is still on screen. The ruler keeps its static `.on` zone 1.
- **D14 hero crosshair.** Decoration that moves over the headline and primary CTA, the content the visitor must read and act on, plus a custom cursor. It reads as an agency gimmick.
- **D04 as a site-wide scroll reveal.** Hiding and revealing static content on every page has no purpose beyond decoration, slows down scanning, and would animate prices on Pricing (the handoff forbids it). It survives only as the Home project-cards entrance.

## Decisions

1. **Native cross-document View Transitions, not Astro `ClientRouter`.** `@view-transition { navigation: auto; }` gives the morph and crossfade with zero JS.
   - Every navigation stays a normal page load, so existing scripts keep working. This retires the SP2 debt "rewire scripts for ClientRouter".
   - Browsers without cross-document View Transitions (Firefox today) swap instantly, which the QA checklist allows.
2. **No dependencies.** No `motion` library; IntersectionObserver plus CSS and the Web Animations API cover everything.
3. **Tokens and `motion.css` stay byte-identical** (`tests/tokens.spec.ts`).
   - Their `::view-transition-*` rules, `.js [data-reveal]` and keyframes are reused.
   - Overrides and new global rules go in `src/styles/transitions.css`, imported by `global.css` after `motion.css`.
   - Component-specific motion lives in the component's scoped `<style>`.
4. **Animate only transform, opacity, clip-path and stroke-dashoffset.** Never animate: focus rings, nav jumps, content already revealed, the status dot, prices or spec values, loops, elevation on hover.
5. **Never delay the LCP.** No element that can be the Largest Contentful Paint (hero h1, case header) starts at `opacity: 0`. Entrances on those elements are transform-only.
6. **Reduced motion:** the tokens already zero rise, shake, stagger and press. Every new animation either has a `prefers-reduced-motion: reduce` branch that keeps only opacity, or is skipped (signature drawing).
7. **No JS:** all content stays visible. `[data-reveal]` hides only under `html.js`.

## Global

### `html.js` and head flags (HeadCommon inline script)

The existing inline theme script also:

- adds `js` to `<html>` (the hook `motion.css` expects);
- adds `sig` to `<html>` when the page is Home and `sessionStorage['fm-sig']` is unset, then sets it (D03, first load per session). If storage is blocked, there's no signature.

Running before first paint avoids a flash of the unanimated or hidden state.

### Navigation fade and D05 Card → case (`transitions.css`, ProjectCard, CasePage)

- `@view-transition { navigation: auto; }`.
- **Short crossfade.** Every navigation (tens per visit) crossfades the page. `transitions.css` sets `--dur-fade` (150ms) on the root group and its old/new images, and on named elements that enter or leave without a partner (`::view-transition-old/new(*):only-child`). It keeps `motion.css`'s fade keyframes and easing. Only a paired card → case morph keeps `--dur-sheet`. The longer durations would add perceived latency to every click.
- **Morph:** the `ProjectCard` root and the CasePage header sheet get `style="view-transition-name: sheet-{id}"` (id = case id, e.g. `fm-01`).
  - Names must be unique per page, and every page listing several cards uses distinct ids.
  - The morph group keeps `motion.css`'s `--dur-sheet` (450ms) `--ease-in-out`.
  - Under reduced motion `motion.css` already shortens groups to `--dur-fade`.

### D06 Theme (ThemeToggle)

On click, if `document.startViewTransition` exists and reduced motion is off:

1. add `theme-reveal` to `<html>` (`motion.css` disables the default root animation);
2. `startViewTransition(() => setTheme(next))`;
3. on `ready`, animate `::view-transition-new(root)` `clipPath` from `circle(0 at x y)` to `circle(r at x y)`, where x/y is the toggle's centre and r the distance to the farthest viewport corner; 450ms (`--dur-sheet`), `--ease-in-out`;
4. remove `theme-reveal` on `finished`.

Under reduced motion it's a plain cross-fade: a view transition without the class, which keeps the root fade. Without the API the swap is instant. The theme logic stays one function shared by both buttons.

- **Named sheets are left out.** The reveal is a same-document transition, so elements with a `view-transition-name` would be captured and would crossfade on top of the circle. While `html.theme-reveal` is set, `[data-vt]` elements (the card and case sheets) get `view-transition-name: none`.
- **Fast repeat clicks.** A second click skips the running transition; only the latest transition removes `theme-reveal`.
- **Duration.** It is read from `--dur-sheet` with its unit, because the built CSS is minified (`.45s`).

### D07 Language (LangSwitch)

- The fade is the 150ms root crossfade above. It already matches the D07 timing, so no extra class is needed.
- **Keep the reading position.** A plain click on an alternate-language link stores it in `sessionStorage['fm-lang-swap']`, alongside the existing `localStorage.lang`, together with the target path. A modified click (new tab or window) stores nothing, because the other tab doesn't share this tab's `sessionStorage`.
  - Stored value: the index of the innermost `main section` crossing the viewport top, plus the pixel offset into it.
  - A raw `scrollY` would drift, because EN and ES copy differ in length.
- **Restore on the twin page.** A tiny script scrolls to the same block index plus the offset, clamped to that block's height.
  - It runs when the module script executes (the document is parsed), only if the current path is the stored target, then clears the flag. A one-frame paint at the top is possible and accepted.
  - If the twin has fewer blocks, it falls back to the top.

## Per component

### D03 Home signature (HeroSheet)

Applies only when `html.sig` is set and reduced motion is off.

- **Frame:** four 2px edge elements (`.edge-t/r/b/l`, `aria-hidden`) draw the 2px frame by scaling from 0 to 1 along their axis: top left→right, right top→bottom, bottom right→left, left bottom→top.
  - Timing: `--dur-draw` (600ms), `--ease-draw`, delays 0/130/260/390ms.
  - During the signature the real border is transparent and the edges sit over it. The edges stay in place after drawing (fill-mode `both`, `--line-strong`), so they follow theme changes, with the same pixels as the border and no script.
- **Ruler:** the zones fade in with a 30ms stagger after the frame (start ≈ 520ms).
- **Headline:** the h1 rises by `--rise` with **transform only** (`--dur-enter`, `--ease-out`). It is never transparent, so the Home LCP isn't delayed.
- **Corner:** the corner mark scales and fades in last.
- The total is ≈ 1s.
- Pure CSS animations keyed on `html.sig`. Nothing is `pointer-events: none` or `inert`, so input is never blocked.

### D04 Home project cards entrance (HomePage)

- The case-card grid on Home (`.cases`) gets `data-reveal-group`. Its cards rise `--rise` and fade in, 350ms `--ease-out`, with a 60ms stagger (`--i` = index, capped at 5).
- The cards' spec values move with their card and are never animated on their own; the handoff rule against animating prices and spec values is about the values themselves.
- **Script:** `src/scripts/reveal.ts`, imported from HomePage only. It observes the group with IntersectionObserver (`rootMargin: 0px 0px -10% 0px`), adds `.is-in` once, then disconnects.
  - If the group is already in the viewport on load, it is marked immediately (`getBoundingClientRect`, before first frame), with no fade.
- **Hidden content never gets stuck hidden:**
  - `@media print` shows every `[data-reveal]`;
  - `beforeprint`, a `#hash` on load and `hashchange` mark the group `.is-in` immediately.
- **Not used anywhere else** (no other page, section, price or nav/footer element).

### D08 Mobile menu (SiteNav)

- **Open:** remove `hidden`, then animate the panel `clip-path: inset(0 0 100% 0)` → `inset(0)` in 250ms `--ease-out`. This is shorter than the handoff's 350/250ms and drops its 30ms row stagger, by the owner's decision after the motion audit (2026-10-07): the menu opens repeatedly on mobile, and the longer timing and the cascade make it feel slow.
- **Close:** animate the clip back over 200ms, then set `hidden`.
- Implemented with Web Animations (`element.animate`), so `hidden` toggles after the close finishes. A new open or close cancels the running one.
- Reduced motion: an opacity fade only.
- Focus management and Escape behaviour stay as they are.

### D11 Confirmation (ContactSentPage)

- The `.sent` panel rises (`--rise`, 350ms, `--ease-out`) on load.
- The check `path` (already `pathLength="1"`) draws via `stroke-dasharray: 1; stroke-dashoffset: 1 → 0`, 400ms `--ease-draw`, with a 200ms delay.
- Pure CSS. The panel rise is transform-only (the panel holds the page's LCP, Decision 5), so under reduced motion (`--rise: 0`) it doesn't move and the check is static.

### D15 404 (pages/404.astro)

Each diagonal is drawn by a `clip-path` that grows from its start corner (`inset(0 100% 100% 0)` / `inset(0 0 100% 100%)` → `inset(0)`), 600ms `--ease-draw`, the second 120ms later. Dash-based drawing doesn't work here: the strokes use `vector-effect: non-scaling-stroke`, which ignores `pathLength`. The keyframes need an explicit end, because `inset()` doesn't interpolate to `none`. Pure CSS. Under reduced motion they are static.

## Testing

New and updated Playwright specs, run locally with `--workers=1`.

- **Global (`tests/motion.spec.ts`):**
  - `html.js` is present.
  - The `@view-transition` rule is in the CSS, and the root view-transition duration override is `--dur-fade`.
  - `view-transition-name` values are unique per page, sampled on Home, Work index and a case page.
  - The card and the case header share `sheet-{id}`.
- **D03:**
  - The first visit to `/en` adds `html.sig`; a second visit in the same context doesn't; other pages never get it.
  - The h1's computed `opacity` is `1` throughout (no LCP delay).
  - With reduced motion, no edge animation runs.
- **D04:**
  - Only Home has `[data-reveal]`.
  - With JS disabled, the cards are visible.
  - With JS, they get `.is-in` after scrolling, or immediately when already in view, and under a `#hash`.
  - Under reduced motion there is no transform.
  - `@media print` shows them.
- **D06:** clicking the toggle still flips `data-theme` and `localStorage`, with and without `startViewTransition` (stubbed away).
- **D07:** switching language while scrolled into a section lands on the same section of the twin page.
- **D08:** opening sets `aria-expanded=true` and shows the panel; closing hides it after the animation; Escape closes it; a fast double toggle ends in a consistent state.
- **D11 / D15:** the animated elements exist with `pathLength=1`; under reduced motion `animation-name` is `none`.
- **Regression:** the full existing suite stays green; `tokens.spec` proves `motion.css` is untouched.
- **Manual QA (screenshots and notes in the PR):**
  - 4× slow motion (DevTools animation panel) for D03, D04, D05, D06, D08, D11, D15;
  - Firefox swaps instantly;
  - nothing overflows at 375;
  - the Home LCP is not regressed (Lighthouse before and after).

## Out of scope

Blog transitions (SP7). Any looping or ambient animation. Changing token values. D12, D13, D14 and a site-wide scroll reveal (dropped above).
